const tipoReporte = document.getElementById("tipoReporte");
const contenedorFechas = document.getElementById("contenedorFechas");
const fechaDesde = document.getElementById("fechaDesde");
const fechaHasta = document.getElementById("fechaHasta");
const btnGenerarReportes = document.getElementById("btnGenerarReportes");

const ETIQUETAS_TIPO = {
    ventas: "Ventas",
    inventario: "Inventario",
    gastos: "Gastos",
};

function mostrarAlerta(mensaje, tipo) {
    const contenedor = document.getElementById("contenedorAlertas");
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina(["administrador"]);
    if (!usuario) return;

    tipoReporte.addEventListener("change", actualizarVisibilidadFechas);
    btnGenerarReportes.addEventListener("click", generarReporte);

    await cargarHistorialReportes();
});

async function cargarHistorialReportes() {
    const tbody = document.querySelector("#tablaReportes tbody");
    try {
        const datos = await apiFetch("/reportes.php");
        tbody.innerHTML = "";

        if (datos.reportes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Todavía no generaste ningún reporte.</td></tr>`;
            return;
        }

        datos.reportes.forEach((r) => {
            const fila = document.createElement("tr");
            const enlace = r.archivo
                ? `<a href="${API_BASE}/reporte-archivo.php?id=${r.id}" target="_blank" rel="noopener">Descargar PDF</a>`
                : "Sin archivo";

            fila.innerHTML = `
                <td>${r.fecha_inicio || "-"}</td>
                <td>${r.fecha_fin || "-"}</td>
                <td>${ETIQUETAS_TIPO[r.tipo] || r.tipo}</td>
                <td>${enlace}</td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        mostrarAlerta("No se pudo cargar el historial de reportes: " + error.message, "danger");
    }
}

// El inventario es una "foto" del stock actual, no tiene sentido
// filtrarlo por fecha — se ocultan los campos con d-none.
function actualizarVisibilidadFechas() {
    if (tipoReporte.value === "inventario") {
        contenedorFechas.classList.add("d-none");
    } else {
        contenedorFechas.classList.remove("d-none");
    }
}

async function generarReporte() {
    document.getElementById("contenedorAlertas").innerHTML = "";

    const tipo = tipoReporte.value;
    if (tipo === "") {
        mostrarAlerta("Seleccione un tipo de reporte.", "danger");
        return;
    }

    const desde = fechaDesde.value;
    const hasta = fechaHasta.value;

    if (tipo !== "inventario") {
        if (!desde || !hasta) {
            mostrarAlerta("Seleccione la fecha inicial y final.", "danger");
            return;
        }
        if (desde > hasta) {
            mostrarAlerta("La fecha inicial no puede ser posterior a la final.", "danger");
            return;
        }
    }

    let titulo = "";
    let columnas = [];
    let filas = [];

    try {
        if (tipo === "ventas") {
            const datos = await apiFetch(`/ventas.php?desde=${desde}&hasta=${hasta}`);
            titulo = `Reporte de Ventas (${desde} a ${hasta})`;
            columnas = ["Producto", "Fecha", "Hora", "Cantidad", "Precio unitario", "Total"];
            filas = datos.ventas.map((v) => {
                const cantidad = Number(v.cantidad) || 0;
                const precioUnitario = Number(v.precio_unitario) || 0;
                return [
                    v.producto_nombre || "Sin producto",
                    v.fecha || "-",
                    v.hora || "-",
                    cantidad,
                    `$${precioUnitario.toFixed(2)}`,
                    `$${(cantidad * precioUnitario).toFixed(2)}`,
                ];
            });
        } else if (tipo === "gastos") {
            const datos = await apiFetch(`/gastos.php?desde=${desde}&hasta=${hasta}`);
            titulo = `Reporte de Gastos (${desde} a ${hasta})`;
            columnas = ["Fecha", "Concepto", "Categoría", "Método de pago", "Monto", "Observaciones"];
            filas = datos.gastos.map((g) => [
                g.fecha || "-",
                g.concepto || "-",
                g.categoria || "-",
                g.metodo_pago || "-",
                `$${g.monto}`,
                g.observacion || "-",
            ]);
        } else if (tipo === "inventario") {
            const datos = await apiFetch("/productos.php");
            titulo = "Reporte de Inventario (stock actual)";
            columnas = ["Producto", "Precio", "Stock", "Umbral mínimo", "Descripción"];
            filas = datos.productos.map((p) => [
                p.nombre,
                `$${p.precio}`,
                p.stock,
                p.umbral_minimo,
                p.descripcion || "-",
            ]);
        }
    } catch (error) {
        mostrarAlerta("No se pudo generar el reporte: " + error.message, "danger");
        return;
    }

    if (filas.length === 0) {
        mostrarAlerta("No hay datos para el rango/tipo seleccionado.", "warning");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(titulo, 14, 15);

    doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 20,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 60, 114] },
    });

    const nombreArchivo = `reporte_${tipo}_${Date.now()}.pdf`;
    const pdfBlob = doc.output("blob");

    const formData = new FormData();
    formData.append("tipo", tipo);
    if (tipo !== "inventario") {
        formData.append("fecha_inicio", desde);
        formData.append("fecha_fin", hasta);
    }
    formData.append("archivo", pdfBlob, nombreArchivo);

    try {
        await apiFetch("/reportes.php", { method: "POST", body: formData });
    } catch (error) {
        // El PDF ya está armado en el navegador: si falla guardarlo en
        // el historial, que al menos se lo lleve descargado igual.
        doc.save(nombreArchivo);
        mostrarAlerta("El PDF se descargó, pero no se pudo guardar en el historial: " + error.message, "warning");
        return;
    }

    doc.save(nombreArchivo);
    await cargarHistorialReportes();
    mostrarAlerta("Reporte generado y guardado con éxito.", "success");
}
