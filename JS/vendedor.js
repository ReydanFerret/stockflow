//Se declara un array con productos y precio
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

//Se declaran constantes con los inputs de registro de ventas y la tabla donde se ven las mismas
const selectProducto = document.getElementById("selectProducto");
const cantidad = document.getElementById("cantidad");
const precio = document.getElementById("precio");
const total = document.getElementById("total");
const btnRegistrarVenta = document.getElementById("btnRegistrarVenta");
const tablaVentas = document.querySelector("#tablaVentas tbody");

//Variable que guarda el último código de comprador generado y que arranca en 3
let ultimoCodigo = 3;

//Se crea la opción por defecto del select (placeholder)
const opcionInicial = document.createElement("option");

opcionInicial.value = ""; //Sin valor, para poder detectar que no se eligió nada
opcionInicial.textContent = "Seleccione un producto"; //Texto que ve el usuario
opcionInicial.disabled = true; //No se puede volver a seleccionar una vez elegido otro producto
opcionInicial.selected = true; //Aparece seleccionada al cargar la página

//Se agrega la opción inicial al select
selectProducto.appendChild(opcionInicial);

//Se recorre el array de productos para crear una <option> por cada uno
productos.forEach((producto, indice) => {

    const opcion = document.createElement("option");

    opcion.value = indice; //El value guarda el índice del producto en el array
    opcion.textContent = producto.nombre; //El texto visible es el nombre del producto

    selectProducto.appendChild(opcion); //Se agrega la opción al select

});

//Evento que se ejecuta cuando el usuario cambia la selección del producto
selectProducto.addEventListener("change", function () {

    //Si vuelve a quedar sin selección
    if (this.value === "") {

        precio.value = ""; //Se limpia el precio
        total.value = "";  //Se limpia el total
        return; //Se corta la ejecución acá
    }

    //Se autocompleta el campo precio según el producto elegido
    precio.value = productos[this.value].precio;

    //Se recalcula el total con el nuevo precio
    calcularTotal();
});

//Cada vez que el usuario escribe en el campo cantidad, se recalcula el total
cantidad.addEventListener("input", calcularTotal);

//Función que calcula el total = cantidad * precio
function calcularTotal() {

    const cant = Number(cantidad.value); //Convierte el valor de cantidad a número
    const prec = Number(precio.value);   //Convierte el valor de precio a número

    //Solo calcula si ambos valores son mayores a 0
    if (cant > 0 && prec > 0) {

        total.value = cant * prec;

    } else {

        total.value = ""; //Si falta algún dato, se deja el total vacío

    }

}

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


//Evento del botón para registrar una nueva venta
btnRegistrarVenta.addEventListener("click", function (e) {

    e.preventDefault(); //Evita que el formulario recargue la página
    
    // Limpia alertas previas en la pantalla
    document.getElementById("contenedorAlertas").innerHTML = "";

    //Validación: debe haber un producto seleccionado
    if (selectProducto.value === "") {
        mostrarAlerta("Seleccione un producto.", "danger");
        return;
    }

    //Validación: debe haber una cantidad cargada
    if (cantidad.value === "") {
        mostrarAlerta("Ingrese una cantidad.", "danger");
        return;
    }

    //Se obtiene la fecha y hora actual del sistema
    const ahora = new Date();

    //Se formatea la fecha en formato uruguayo (dd/mm/aaaa)
    const fecha = ahora.toLocaleDateString("es-UY");

    //Se formatea la hora en formato 24hs (HH:MM)
    const hora = ahora.toLocaleTimeString("es-UY", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });

    //Se incrementa el contador de código de comprador
    ultimoCodigo++;

    //Se arma el código del comprador, ej: C000004 (se rellena con ceros a la izquierda)
    const codigoComprador = "C" + String(ultimoCodigo).padStart(6, "0");

    //Se crea una nueva fila (<tr>) para la tabla de ventas
    const fila = document.createElement("tr");

    //Se completa la fila con los datos de la venta
    fila.innerHTML = `
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${productos[selectProducto.value].nombre}</td>
        <td>${cantidad.value}</td>
        <td>$${precio.value}</td>
        <td>$${total.value}</td>
        <td>${codigoComprador}</td>
    `;

    //Se agrega la fila creada al cuerpo (tbody) de la tabla de ventas
    tablaVentas.appendChild(fila);

    // Muestra el mensaje de éxito usando el formato que buscabas
    mostrarAlerta("Venta registrada con éxito.", "success");

    //Se resetean los campos del formulario para cargar una nueva venta
    selectProducto.selectedIndex = 0; //Vuelve a mostrar "Seleccione un producto"
    cantidad.value = "";
    precio.value = "";
    total.value = "";
});
