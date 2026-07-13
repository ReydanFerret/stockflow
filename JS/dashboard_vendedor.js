const productos = [
    {
        nombre: "Teclado Mecánico",
        precio: 25
    },
    {
        nombre: "Mouse Gamer",
        precio: 60
    },
    {
        nombre: "Auriculares",
        precio: 40
    }
];

const selectProducto = document.getElementById("selectProducto");
const cantidad = document.getElementById("cantidad");
const precio = document.getElementById("precio");
const total = document.getElementById("total");
const btnRegistrarVenta = document.getElementById("btnRegistrarVenta");
const tablaVentas = document.querySelector("#tablaVentas tbody");

let ultimoCodigo = 3;

const opcionInicial = document.createElement("option");

opcionInicial.value = "";
opcionInicial.textContent = "Seleccione un producto";
opcionInicial.disabled = true;
opcionInicial.selected = true;

selectProducto.appendChild(opcionInicial);

productos.forEach((producto, indice) => {

    const opcion = document.createElement("option");

    opcion.value = indice;
    opcion.textContent = producto.nombre;

    selectProducto.appendChild(opcion);

});

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

    if (cant > 0 && prec > 0) {

        total.value = cant * prec;

    } else {

        total.value = "";

    }

}

btnRegistrarVenta.addEventListener("click", function (e) {

    e.preventDefault();

    if (selectProducto.value === "") {

        alert("Seleccione un producto.");
        return;

    }

    if (cantidad.value === "") {

        alert("Ingrese una cantidad.");
        return;

    }

    const ahora = new Date();

    const fecha = ahora.toLocaleDateString("es-UY");

    const hora = ahora.toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    ultimoCodigo++;

    const codigoComprador = "C" + String(ultimoCodigo).padStart(6, "0");

    const fila = document.createElement("tr");

    fila.innerHTML = `
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${productos[selectProducto.value].nombre}</td>
        <td>${cantidad.value}</td>
        <td>$${precio.value}</td>
        <td>$${total.value}</td>
        <td>${codigoComprador}</td>
    `;

    tablaVentas.appendChild(fila);

    selectProducto.selectedIndex = 0;
    cantidad.value = "";
    precio.value = "";
    total.value = "";

});