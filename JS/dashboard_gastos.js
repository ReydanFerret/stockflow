const tipoGasto = document.getElementById("tipoGasto");
const otroTipoGasto = document.getElementById("otroTipoGasto");
const descripcionGasto = document.getElementById("descripcionGasto");
const montoGasto = document.getElementById("montoGasto");
const metodoPago = document.getElementById("metodoPago");
const otroMetodoPago = document.getElementById("otroMetodoPago");
const btnRegistrarGasto = document.getElementById("btnRegistrarGasto");
const tablaGastos = document.querySelector("#tablaGastos tbody");
const observacionesGasto = document.getElementById("observacionesGasto");

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

btnRegistrarGasto.addEventListener("click", function () {

    if (tipoGasto.selectedIndex === 0) {

        alert("Seleccione un tipo de gasto.");
        return;

    }

    if (descripcionGasto.value.trim() === "") {

        alert("Ingrese una descripción.");
        return;

    }

    if (montoGasto.value === "" || Number(montoGasto.value) <= 0) {

        alert("Ingrese un monto válido.");
        return;

    }

    if (metodoPago.selectedIndex === 0) {

        alert("Seleccione un método de pago.");
        return;

    }

    let categoria = tipoGasto.value;

    if (categoria === "Otro") {

        if (otroTipoGasto.value.trim() === "") {

            alert("Especifique el tipo de gasto.");
            return;

        }

        categoria = otroTipoGasto.value.trim();

    }

    let metodo = metodoPago.value;

    if (metodo === "Otro") {

        if (otroMetodoPago.value.trim() === "") {

            alert("Especifique el método de pago.");
            return;

        }

        metodo = otroMetodoPago.value.trim();

    }

    const ahora = new Date();

    const fecha = ahora.toLocaleDateString("es-UY");

    const hora = ahora.toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

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