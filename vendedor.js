let productos = []; // se llena con lo que devuelva /productos.php

const selectProducto = document.getElementById("selectProducto");
const cantidad = document.getElementById("cantidad");
const precio = document.getElementById("precio");
const total = document.getElementById("total");
const btnRegistrarVenta = document.getElementById("btnRegistrarVenta");
const tablaVentas = document.querySelector("#tablaVentas tbody");

const ZONA_HORARIA = "America/Montevideo";

// PocketBase devuelve "2026-10-02 14:30:00.123Z" (con espacio);
// se cambia por "T" para que new Date() lo interprete bien en todos los navegadores
function parsearFechaPB(valor) {
    if (!valor) return null;
    const d = new Date(String(valor).replace(" ", "T"));
    return isNaN(d.getTime()) ? null : d;
}

// Fecha + hora reales de creación, en hora de Montevideo
function formatearCreado(valor) {
    const d = parsearFechaPB(valor);
    if (!d) return { fecha: null, hora: null };
    return {
        fecha: d.toLocaleDateString("es-UY", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: ZONA_HORARIA,
        }),
        hora: d.toLocaleTimeString("es-UY", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone: ZONA_HORARIA,
        }),
    };
}

// Para campos de solo fecha (guardados a medianoche UTC): se muestra en UTC
// para que no se corra un día por la zona horaria.
function formatearFecha(valor) {
    if (!valor) return "Sin fecha";

    const fecha = parsearFechaPB(valor);
    if (!fecha) return "Sin fecha";

    return fecha.toLocaleDateString("es-UY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    });
}

// Más recientes primero
function ordenarRecientesPrimero(lista) {
    const marca = (x) => parsearFechaPB(x.created)?.getTime() || 0;
    return [...lista].sort((a, b) => marca(b) - marca(a));
}

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
    const usuario = await protegerPagina(["vendedor", "administrador"]);
    if (!usuario) return;

    await cargarProductosParaSelect();
    await cargarHistorialVentas();
});

async function cargarProductosParaSelect() {
    try {
        const datos = await apiFetch("/productos.php");
        productos = datos.productos;

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Seleccione un producto";
        opcionInicial.disabled = true;
        opcionInicial.selected = true;
        selectProducto.appendChild(opcionInicial);

        productos.forEach((producto, indice) => {
            const opcion = document.createElement("option");
            opcion.value = indice; // el índice apunta al array "productos" en memoria
            opcion.textContent = `${producto.nombre} (stock: ${producto.stock})`;
            selectProducto.appendChild(opcion);
        });
    } catch (error) {
        mostrarAlerta("No se pudieron cargar los productos: " + error.message, "danger");
    }
}

async function cargarHistorialVentas() {
    try {
        const datos = await apiFetch("/ventas.php");
        tablaVentas.innerHTML = "";

        ordenarRecientesPrimero(datos.ventas).forEach((venta) => {
            const fila = document.createElement("tr");
            const creado = formatearCreado(venta.created);

            // Si "created" no llega, se usan fecha/hora guardadas como respaldo
            const fechaFormateada = creado.fecha || formatearFecha(venta.fecha);
            const horaFormateada = creado.hora || venta.hora || "-";

            // Obtener nombre del producto
            const nombreProducto =
                venta.producto_nombre ||
                venta.producto?.nombre ||
                venta.producto ||
                "Sin producto";

            const cantidadVenta = Number(venta.cantidad) || 0;
            const precioUnitario = Number(venta.precio_unitario) || 0;
            const totalVenta = cantidadVenta * precioUnitario;

            fila.innerHTML = `
                <td>${nombreProducto}</td>
                <td>${fechaFormateada}</td>
                <td>${horaFormateada}</td>
                <td>${cantidadVenta}</td>
                <td>$${precioUnitario.toFixed(2)}</td>
                <td>$${totalVenta.toFixed(2)}</td>
            `;

            tablaVentas.appendChild(fila);
        });
    } catch (error) {
        console.error("No se pudo cargar el historial de ventas:", error);
    }
}

selectProducto.addEventListener("change", function () {
    if (this.value === "") {
        precio.value = "";
        total.value = "";
        return;
    }
    precio.value = productos[this.value].precio;
    calcularTotal();
});

cantidad.addEventListener("input", calcularTotal);

function calcularTotal() {
    const cant = Number(cantidad.value);
    const prec = Number(precio.value);
    total.value = cant > 0 && prec > 0 ? cant * prec : "";
}

btnRegistrarVenta.addEventListener("click", async function (e) {
    e.preventDefault();
    document.getElementById("contenedorAlertas").innerHTML = "";

    if (selectProducto.value === "") {
        mostrarAlerta("Seleccione un producto.", "danger");
        return;
    }
    if (cantidad.value === "") {
        mostrarAlerta("Ingrese una cantidad.", "danger");
        return;
    }

    const productoElegido = productos[selectProducto.value];

    try {
        await apiFetch("/ventas.php", {
            method: "POST",
            body: {
                producto_id: productoElegido.id,
                cantidad: Number(cantidad.value),
                precio_unitario: Number(precio.value),
            },
        });

        mostrarAlerta("Venta registrada con éxito.", "success");
        await cargarHistorialVentas();

        // Refrescar el select para que el stock mostrado quede actualizado
        selectProducto.innerHTML = "";
        await cargarProductosParaSelect();

        selectProducto.selectedIndex = 0;
        cantidad.value = "";
        precio.value = "";
        total.value = "";
    } catch (error) {
        // Si el mensaje del backend indica stock insuficiente,
        // mostramos una advertencia (amarilla) en vez de un error genérico (rojo)
        const esStockInsuficiente = error.message.toLowerCase().includes("stock insuficiente");
        const tipoAlerta = esStockInsuficiente ? "warning" : "danger";
        const prefijo = esStockInsuficiente ? "" : "No se pudo registrar la venta: ";

        mostrarAlerta(prefijo + error.message, tipoAlerta);
    }
});
