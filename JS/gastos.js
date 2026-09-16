const tipoGasto = document.getElementById("tipoGasto");
const otroTipoGasto = document.getElementById("otroTipoGasto");
const descripcionGasto = document.getElementById("descripcionGasto");
const montoGasto = document.getElementById("montoGasto");
const metodoPago = document.getElementById("metodoPago");
const otroMetodoPago = document.getElementById("otroMetodoPago");
const btnRegistrarGasto = document.getElementById("btnRegistrarGasto");
const tablaGastos = document.querySelector("#tablaGastos tbody");
const observacionesGasto = document.getElementById("observacionesGasto");

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
    // El backend (gastos.php) restringe ver/crear gastos al rol administrador.
    const usuario = await protegerPagina(["administrador"]);
    if (!usuario) return;

    await cargarHistorialGastos();
});

async function cargarHistorialGastos() {
    try {
        const datos = await apiFetch("/gastos.php");
        tablaGastos.innerHTML = "";
        datos.gastos.forEach((gasto) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${gasto.fecha}</td>
                <td>${gasto.hora}</td>
                <td>${gasto.concepto}</td>
                <td>${gasto.categoria}</td>
                <td>${gasto.metodo_pago}</td>
                <td>$${gasto.monto}</td>
                <td>${gasto.observacion || "Sin observaciones"}</td>
            `;
            tablaGastos.appendChild(fila);
        });
    } catch (error) {
        console.error("No se pudo cargar el historial de gastos:", error.message);
    }
}

tipoGasto.addEventListener("change", function () {
    if (this.value === "Otro") {
        otroTipoGasto.classList.remove("d-none");
        otroTipoGasto.focus();
    } else {
        otroTipoGasto.classList.add("d-none");
        otroTipoGasto.value = "";
    }
});

metodoPago.addEventListener("change", function () {
    if (this.value === "Otro") {
        otroMetodoPago.classList.remove("d-none");
        otroMetodoPago.focus();
    } else {
        otroMetodoPago.classList.add("d-none");
        otroMetodoPago.value = "";
    }
});

btnRegistrarGasto.addEventListener("click", async function (e) {
    e.preventDefault();

    const contenedorExistente = document.getElementById("contenedorAlertas");
    if (contenedorExistente) contenedorExistente.innerHTML = "";

    if (tipoGasto.selectedIndex === 0) {
        mostrarAlerta("Seleccione un tipo de gasto.", "danger");
        return;
    }
    if (descripcionGasto.value.trim() === "") {
        mostrarAlerta("Ingrese un concepto de gasto.", "danger");
        return;
    }
    if (montoGasto.value === "" || Number(montoGasto.value) <= 0) {
        mostrarAlerta("Ingrese un monto válido.", "danger");
        return;
    }
    if (metodoPago.selectedIndex === 0) {
        mostrarAlerta("Seleccione un método de pago.", "danger");
        return;
    }

    let categoria = tipoGasto.value;
    if (categoria === "Otro") {
        if (otroTipoGasto.value.trim() === "") {
            mostrarAlerta("Especifique el tipo de gasto.", "danger");
            return;
        }
        categoria = otroTipoGasto.value.trim();
    }

    let metodo = metodoPago.value;
    if (metodo === "Otro") {
        if (otroMetodoPago.value.trim() === "") {
            mostrarAlerta("Especifique el método de pago.", "danger");
            return;
        }
        metodo = otroMetodoPago.value.trim();
    }

    try {
        await apiFetch("/gastos.php", {
            method: "POST",
            body: {
                categoria,
                concepto: descripcionGasto.value.trim(),
                monto: Number(montoGasto.value),
                metodo_pago: metodo,
                observacion: observacionesGasto.value.trim(),
            },
        });

        mostrarAlerta("Gasto registrado con éxito.", "success");
        await cargarHistorialGastos();

        tipoGasto.selectedIndex = 0;
        otroTipoGasto.value = "";
        otroTipoGasto.classList.add("d-none");
        observacionesGasto.value = "";
        descripcionGasto.value = "";
        montoGasto.value = "";
        metodoPago.selectedIndex = 0;
        otroMetodoPago.value = "";
        otroMetodoPago.classList.add("d-none");
    } catch (error) {
        mostrarAlerta("No se pudo registrar el gasto: " + error.message, "danger");
    }
});
