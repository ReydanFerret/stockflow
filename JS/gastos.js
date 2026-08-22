const tipoGasto = document.getElementById("tipoGasto");
const otroTipoGasto = document.getElementById("otroTipoGasto");
const descripcionGasto = document.getElementById("descripcionGasto");
const montoGasto = document.getElementById("montoGasto");
const metodoPago = document.getElementById("metodoPago");
const otroMetodoPago = document.getElementById("otroMetodoPago");
const btnRegistrarGasto = document.getElementById("btnRegistrarGasto");
const tablaGastos = document.querySelector("#tablaGastos tbody");
const observacionesGasto = document.getElementById("observacionesGasto");

// Esto es para mostrar las alertas sin usar al alert
function mostrarAlerta(mensaje, tipo) {
    const contenedor = document.getElementById("contenedorAlertas");
    if (contenedor) { // Validación de seguridad
        contenedor.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    } else {
        console.error("No se encontró el contenedor con ID 'contenedorAlertas' en el HTML.");
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

btnRegistrarGasto.addEventListener("click", function (e) {
    e.preventDefault(); // Evita comportamientos extraños del botón

    // Limpia alertas previas borrando el contenido del contenedor si existe
    const contenedorExistente = document.getElementById("contenedorAlertas");
    if (contenedorExistente) {
        contenedorExistente.innerHTML = "";
    }

    // Validación: tipo de gasto
    if (tipoGasto.selectedIndex === 0) {
        mostrarAlerta("Seleccione un tipo de gasto.", "danger", btnRegistrarGasto);
        return;
    }

    // Validación: descripción
    if (descripcionGasto.value.trim() === "") {
        mostrarAlerta("Ingrese un concepto de gasto.", "danger", btnRegistrarGasto);
        return;
    }

    // Validación: monto
    if (montoGasto.value === "" || Number(montoGasto.value) <= 0) {
        mostrarAlerta("Ingrese un monto válido.", "danger", btnRegistrarGasto);
        return;
    }

    // Validación: método de pago
    if (metodoPago.selectedIndex === 0) {
        mostrarAlerta("Seleccione un método de pago.", "danger", btnRegistrarGasto);
        return;
    }

    let categoria = tipoGasto.value;

    // Validación condicional: "Otro" tipo de gasto
    if (categoria === "Otro") {
        if (otroTipoGasto.value.trim() === "") {
            mostrarAlerta("Especifique el tipo de gasto.", "danger", btnRegistrarGasto);
            return;
        }
        categoria = otroTipoGasto.value.trim();
    }

    let metodo = metodoPago.value;

    // Validación condicional: "Otro" método de pago
    if (metodo === "Otro") {
        if (otroMetodoPago.value.trim() === "") {
            mostrarAlerta("Especifique el método de pago.", "danger", btnRegistrarGasto);
            return;
        }
        metodo = otroMetodoPago.value.trim();
    }

    // Se obtiene la fecha y hora actual del sistema
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-UY");
    const hora = ahora.toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    // Se crea la nueva fila para la tabla de gastos
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${descripcionGasto.value.trim()}</td>
        <td>${categoria}</td>
        <td>${metodo}</td>
        <td>$${Number(montoGasto.value)}</td>
        <td>${observacionesGasto.value.trim() || "Sin observaciones"}</td>
    `;

    tablaGastos.appendChild(fila);

    // Muestra alerta verde de éxito arriba del botón
    mostrarAlerta("Gasto registrado con éxito.", "success", btnRegistrarGasto);

    // Se resetean los campos del formulario
    tipoGasto.selectedIndex = 0;
    otroTipoGasto.value = "";
    otroTipoGasto.classList.add("d-none");
    observacionesGasto.value = "";
    descripcionGasto.value = "";
    montoGasto.value = "";
    metodoPago.selectedIndex = 0;
    otroMetodoPago.value = "";
    otroMetodoPago.classList.add("d-none");
});
