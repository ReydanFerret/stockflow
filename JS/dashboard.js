//Declaracion de variables
let contador = 4;
let modoEditar = false;
let modoEliminar = false;
let filaSeleccionada = null;

let contadorPersonal = 1;
let modoEliminarPersonal = false;
let filasPersonalSeleccionadas = [];


//Esta función toma los div con id "mensajeError" y le agrega ciertas clases de bootstrap y el rol
//de alert, además agrega un boton para cerrar la alerta
function mostrarError(mensaje) {

    //Si estamos en la sección de personal, muestra el error allí
    if (!document.getElementById("seccionPersonal").classList.contains("d-none")) {

        document.getElementById("mensajeErrorPersonal").innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button"
                        class="btn-close"
                        data-bs-dismiss="alert"></button>
            </div>
        `;

        return;
    }


    document.getElementById("mensajeError").innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"></button>
        </div>
    `;
}


//Esta función toma los div con id "mensajeExito" y le agrega ciertas clases de bootstrap y el rol
//de alert, además agrega un boton para cerrar la alerta
function mostrarExito(mensaje) {

    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"></button>
        </div>
    `;
}


//Función para mostrar mensajes de éxito dentro de la sección de personal
function mostrarExitoPersonal(mensaje) {

    document.getElementById("mensajeExitoPersonal").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"></button>
        </div>
    `;

}


function mostrarAdvertencia(mensaje) {

    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"></button>
        </div>
    `;
}


//Funcion para comprobar si el stock está por debajo del umbral mínimo
function comprobarStock(fila) {

    let stock = Number(fila.cells[3].textContent);
    let umbral = Number(fila.cells[4].textContent);

    if (stock < umbral) {

        fila.cells[3].classList.add("stock-bajo");

    } else {

        fila.cells[3].classList.remove("stock-bajo");

    }

}


//Funcion para comprobar el stock de todos los productos existentes
function comprobarTodosLosStocks() {

    let filas = document.querySelectorAll("#tablaProductos tbody tr");

    filas.forEach(function(fila) {

        comprobarStock(fila);

    });

}


//Funcion para buscar productos dentro de la tabla de estos
function buscarProducto(){

    let filtro = document.getElementById("buscarProducto").value.toLowerCase();

    let tabla = document.getElementById("tablaProductos");

    let filas = tabla.getElementsByTagName("tr");


    for(let i = 1; i < filas.length; i++){

        let producto = filas[i].cells[1].textContent.toLowerCase();

        let precio = filas[i].cells[2].textContent.toLowerCase();

        let stock = filas[i].cells[3].textContent.toLowerCase();


        if(
            producto.includes(filtro) ||
            precio.includes(filtro) ||
            stock.includes(filtro)
        ){

            filas[i].classList.remove("fila-oculta");

        }else{

            filas[i].classList.add("fila-oculta");

        }

    }

}


//Función para activar o desactivar el modo de edición de productos
function activarModoEditar(){

    if(modoEditar){

        modoEditar = false;

        document.getElementById("btnEditar").textContent = "Editar";

        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        filaSeleccionada = null;


        const inputs = document.querySelectorAll(".agregar-producto input");

        inputs.forEach(input => input.value = "");


        document.getElementById("descripcion").value = "";

        return;

    }


    modoEditar = true;

    modoEliminar = false;


    document.getElementById("btnEditar").textContent = "Cancelar";

    document.getElementById("btnEliminar").textContent = "Eliminar";

    document.getElementById("tablaProductos").classList.add("modo-edicion");

    document.getElementById("tablaProductos").classList.remove("modo-eliminar");

}


//Función para activar o desactivar el modo de eliminación de productos
function activarModoEliminar(){

    if(modoEliminar){

        modoEliminar = false;

        document.getElementById("btnEliminar").textContent = "Eliminar";

        document.getElementById("tablaProductos").classList.remove("modo-eliminar");

        return;

    }


    modoEliminar = true;

    modoEditar = false;


    document.getElementById("btnEliminar").textContent = "Cancelar";

    document.getElementById("btnEditar").textContent = "Editar";

    document.getElementById("btnAgregar").textContent = "Agregar Producto";

    document.getElementById("tablaProductos").classList.add("modo-eliminar");

    document.getElementById("tablaProductos").classList.remove("modo-edicion");

    filaSeleccionada = null;

}


//Función para recalcular y actualizar la numeración de las filas en la tabla
function actualizarNumeros(){

    let filas = document.getElementById("tablaProductos").rows;


    for(let i = 1; i < filas.length; i++){

        filas[i].cells[0].textContent = i;

    }


    contador = filas.length;

}


//Función para registrar un nuevo producto en la tabla o guardar los cambios del modo edición
function agregarProducto() {

    let producto = document.getElementById("producto").value.trim();

    let precio = document.getElementById("precio").value;

    let stock = document.getElementById("stock").value;

    let umbral = document.getElementById("umbral").value;

    let imagen = document.getElementById("imagen").files[0];

    let descripcion = document.getElementById("descripcion").value.trim();


    if (producto === "" || precio === "" || stock === "" || umbral === "") {

        mostrarError("Producto, Precio, Stock y Umbral mínimo no pueden estar vacíos.");

        return;

    }


    if (precio < 0 || stock < 0 || umbral < 0) {

        mostrarError("Precio, Stock y Umbral mínimo no pueden ser negativos.");

        return;

    }


    if (imagen && !imagen.type.startsWith("image/")) {

        mostrarError("Solo se permiten archivos de imagen.");

        document.getElementById("imagen").value = "";

        return;

    }


    //SECCIÓN DE EDICIÓN

    if(modoEditar && filaSeleccionada){

        filaSeleccionada.cells[1].textContent = producto;

        filaSeleccionada.cells[2].textContent = "$" + precio;

        filaSeleccionada.cells[3].textContent = stock;

        filaSeleccionada.cells[4].textContent = umbral;

        filaSeleccionada.cells[6].textContent = descripcion || "Sin descripción";


        if(imagen){

            let url = URL.createObjectURL(imagen);

            filaSeleccionada.cells[5].innerHTML =
                `<img src="${url}" class="img-fluid" alt="Imagen del producto">`;

        }


        comprobarStock(filaSeleccionada);


        document.getElementById("producto").value = "";

        document.getElementById("precio").value = "";

        document.getElementById("stock").value = "";

        document.getElementById("umbral").value = "";

        document.getElementById("imagen").value = "";

        document.getElementById("descripcion").value = "";


        filaSeleccionada = null;

        modoEditar = false;


        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        document.getElementById("btnEditar").textContent = "Editar";

        document.getElementById("btnAgregar").textContent = "Agregar Producto";


        mostrarExito("Producto actualizado correctamente.");

        return;

    }


    //SECCIÓN DE CREACIÓN

    let tabla = document.getElementById("tablaProductos");

    //Obtiene directamente el cuerpo de la tabla
    let cuerpoTabla = tabla.querySelector("tbody");

    //Crea la nueva fila dentro del tbody
    let fila = cuerpoTabla.insertRow();


    fila.insertCell(0).innerHTML = contador++;

    fila.insertCell(1).innerHTML = producto;

    fila.insertCell(2).innerHTML = "$" + precio;

    fila.insertCell(3).innerHTML = stock;

    fila.insertCell(4).innerHTML = umbral;


    let celdaImagen = fila.insertCell(5);


    if (imagen) {

        let url = URL.createObjectURL(imagen);

        celdaImagen.innerHTML =
            `<img src="${url}" class="img-fluid" alt="Imagen del producto">`;

    } else {

        celdaImagen.innerHTML = "Sin imagen";

    }


    fila.insertCell(6).innerHTML =
        descripcion || "Sin descripción";


    comprobarStock(fila);


    document.getElementById("producto").value = "";

    document.getElementById("precio").value = "";

    document.getElementById("stock").value = "";

    document.getElementById("umbral").value = "";

    document.getElementById("imagen").value = "";

    document.getElementById("descripcion").value = "";


    mostrarExito("Producto agregado correctamente.");

}

//Función para mostrar la sección de personal
function mostrarSeccionPersonal() {

    document.getElementById("seccionProductos").classList.add("d-none");

    document.getElementById("seccionPersonal").classList.remove("d-none");

}


//Función para volver a mostrar la sección de productos
function volverAProductos() {

    document.getElementById("seccionPersonal").classList.add("d-none");

    document.getElementById("seccionProductos").classList.remove("d-none");

}


//Función para limpiar el formulario de personal
function limpiarFormularioPersonal() {

    document.getElementById("nombreCompletoPersonal").value = "";

    document.getElementById("usuarioPersonal").value = "";

    document.getElementById("correoPersonal").value = "";

    document.getElementById("contrasenaPersonal").value = "";

    document.getElementById("telefonoPersonal").value = "";

    document.getElementById("rolPersonal").value = "";

    document.getElementById("estadoPersonal").value = "Activo";

}


//Función para agregar un nuevo integrante del personal
function agregarPersonal() {

    let nombreCompleto =
        document.getElementById("nombreCompletoPersonal").value.trim();

    let cedula =
        document.getElementById("usuarioPersonal").value.trim();

    let correo =
        document.getElementById("correoPersonal").value.trim();

    let contrasena =
        document.getElementById("contrasenaPersonal").value;

    let telefono =
        document.getElementById("telefonoPersonal").value.trim();

    let rol =
        document.getElementById("rolPersonal").value;

    let estado =
        document.getElementById("estadoPersonal").value;


    //Comprueba que los campos obligatorios estén completos
    if (
        nombreCompleto === "" ||
        cedula === "" ||
        correo === "" ||
        contrasena === "" ||
        rol === ""
    ) {

        mostrarError(
            "Nombre Completo, Cédula de identidad, Correo, Contraseña y Rol no pueden estar vacíos."
        );

        return;

    }


    //Comprueba que la cédula contenga solamente números
    if (!/^[0-9]+$/.test(cedula)) {

        mostrarError(
            "La Cédula de identidad debe contener solamente números."
        );

        return;

    }


    //Comprueba que el correo tenga un formato válido
    if (!correo.includes("@") || !correo.includes(".")) {

        mostrarError(
            "Ingresa un correo electrónico válido."
        );

        return;

    }


    //Comprueba que la contraseña tenga una longitud mínima
    if (contrasena.length < 6) {

        mostrarError(
            "La contraseña debe tener al menos 6 caracteres."
        );

        return;

    }


    //Obtiene la tabla de personal
    let tabla = document.getElementById("tablaPersonal");

    //Obtiene directamente el cuerpo de la tabla
    let cuerpoTabla = tabla.querySelector("tbody");


    //Crea una nueva fila dentro del tbody
    let fila = cuerpoTabla.insertRow();


    //Agrega los datos a la tabla
    fila.insertCell(0).innerHTML = contadorPersonal++;

    fila.insertCell(1).innerHTML = nombreCompleto;

    fila.insertCell(2).innerHTML = cedula;

    fila.insertCell(3).innerHTML = correo;

    fila.insertCell(4).innerHTML =
        telefono || "Sin teléfono";

    fila.insertCell(5).innerHTML = rol;

    fila.insertCell(6).innerHTML = estado;


    //Limpia el formulario
    limpiarFormularioPersonal();


    //Muestra mensaje de éxito
    mostrarExitoPersonal(
        "Personal agregado correctamente."
    );

}

//Función para activar o desactivar el modo de eliminación de personal
function activarModoEliminarPersonal(){

    //Si ya estamos en modo eliminación
    if(modoEliminarPersonal){

        /*
        Si ya hay personas seleccionadas,
        el botón sirve para mostrar la confirmación.
        */
        if(filasPersonalSeleccionadas.length > 0){

            mostrarAlertaEliminarPersonal();

            return;

        }


        //Si no hay personas seleccionadas, se cancela el modo
        modoEliminarPersonal = false;

        document.getElementById("btnEliminarPersonal").textContent =
            "Eliminar Personal";

        filasPersonalSeleccionadas = [];

        return;

    }


    //Activar modo eliminación
    modoEliminarPersonal = true;

    filasPersonalSeleccionadas = [];


    document.getElementById("btnEliminarPersonal").textContent =
        "Confirmar eliminación";

}


//Función para seleccionar o deseleccionar una persona
function seleccionarFilaPersonal(fila){

    //Comprobar si la fila ya está seleccionada
    let indice =
        filasPersonalSeleccionadas.indexOf(fila);


    //Si ya estaba seleccionada, se quita de la selección
    if(indice !== -1){

        filasPersonalSeleccionadas.splice(indice, 1);

        fila.classList.remove("table-warning");

        return;

    }


    //Si no estaba seleccionada, se agrega
    filasPersonalSeleccionadas.push(fila);

    fila.classList.add("table-warning");

}


//Función para construir correctamente la lista de nombres
function construirListaNombres(filas){

    let nombres = filas.map(function(fila){

        return fila.cells[1].textContent.trim();

    });


    //Si hay una sola persona
    if(nombres.length === 1){

        return nombres[0];

    }


    //Si hay dos personas
    if(nombres.length === 2){

        return nombres[0] + " y " + nombres[1];

    }


    //Si hay tres o más personas
    let nombresIniciales =
        nombres.slice(0, -1).join(", ");

    let ultimoNombre =
        nombres[nombres.length - 1];


    return nombresIniciales + " y " + ultimoNombre;

}


//Función para mostrar la alerta de confirmación con los nombres
function mostrarAlertaEliminarPersonal(){

    if(filasPersonalSeleccionadas.length === 0){

        return;

    }


    let listaNombres =
        construirListaNombres(filasPersonalSeleccionadas);


    document.getElementById("textoAlertaEliminarPersonal").innerHTML = `
        <strong>Advertencia:</strong>
        ¿Desea eliminar del personal a ${listaNombres}?
    `;


    const alerta =
        document.getElementById("alertaEliminarPersonal");


    alerta.classList.remove("d-none");

    alerta.classList.add("d-flex");

}


//Función para eliminar las personas seleccionadas
function eliminarPersonalSeleccionado(){

    if(filasPersonalSeleccionadas.length === 0){

        return;

    }


    //Eliminar todas las filas seleccionadas
    filasPersonalSeleccionadas.forEach(function(fila){

        fila.remove();

    });


    //Actualizar numeración
    actualizarNumerosPersonal();


    //Limpiar selección
    filasPersonalSeleccionadas = [];


    //Cerrar alerta
    const alerta =
        document.getElementById("alertaEliminarPersonal");

    alerta.classList.replace("d-flex", "d-none");


    //Mostrar mensaje de éxito
    mostrarExitoPersonal(
        "El personal seleccionado se eliminó correctamente."
    );

}


//Función para cancelar la eliminación
function cancelarEliminacionPersonal(){

    const alerta =
        document.getElementById("alertaEliminarPersonal");


    alerta.classList.replace("d-flex", "d-none");

}


//Función para recalcular y actualizar la numeración de las filas del personal
function actualizarNumerosPersonal(){

    let filas =
        document.getElementById("tablaPersonal").rows;


    for(let i = 1; i < filas.length; i++){

        filas[i].cells[0].textContent = i;

    }


    contadorPersonal = filas.length;

}

//Buscar productos
document.getElementById("buscarProducto").addEventListener(
    "keyup",
    buscarProducto
);


//Activar modo edición
document.getElementById("btnEditar").addEventListener(
    "click",
    activarModoEditar
);


//Activar modo eliminación
document.getElementById("btnEliminar").addEventListener(
    "click",
    activarModoEliminar
);


//Agregar producto
document.getElementById("btnAgregar").addEventListener(
    "click",
    agregarProducto
);


//Mostrar sección de personal
document.getElementById("btnGestionarPersonal").addEventListener(
    "click",
    mostrarSeccionPersonal
);


//Volver a productos
document.getElementById("btnVolverProductos").addEventListener(
    "click",
    volverAProductos
);


//Agregar personal
document.getElementById("btnAgregarPersonal").addEventListener(
    "click",
    agregarPersonal
);


//Activar modo eliminación de personal
document.getElementById("btnEliminarPersonal").addEventListener(
    "click",
    activarModoEliminarPersonal
);


//Botón "Sí, eliminar" del personal
document.getElementById("btnSiPersonal").addEventListener(
    "click",
    eliminarPersonalSeleccionado
);


//Botón "Cancelar" de la alerta de personal
document.getElementById("btnNoPersonal").addEventListener(
    "click",
    cancelarEliminacionPersonal
);


//Validación del nombre del producto
document.getElementById("producto").addEventListener(
    "input",
    function () {

        this.value = this.value.replace(
            /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ."()]/g,
            ""
        );

    }
);


//Validación del precio
document.getElementById("precio").addEventListener(
    "input",
    function () {

        this.value =
            this.value.replace(/[^0-9]/g, "");


        if (this.value.length > 1) {

            this.value =
                this.value.replace(/^0+/, "");

        }

    }
);


//Validación del stock
document.getElementById("stock").addEventListener(
    "input",
    function () {

        this.value =
            this.value.replace(/[^0-9]/g, "");


        if (this.value.length > 1) {

            this.value =
                this.value.replace(/^0+/, "");

        }

    }
);


//Validación del umbral
document.getElementById("umbral").addEventListener(
    "input",
    function () {

        this.value =
            this.value.replace(/[^0-9]/g, "");


        if (this.value.length > 1) {

            this.value =
                this.value.replace(/^0+/, "");

        }

    }
);


//Validación del teléfono
document.getElementById("telefonoPersonal").addEventListener(
    "input",
    function () {

        this.value =
            this.value.replace(/[^0-9]/g, "");

    }
);


//Validación del nombre completo del personal
document.getElementById("nombreCompletoPersonal").addEventListener(
    "input",
    function () {

        this.value = this.value.replace(
            /[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g,
            ""
        );

    }
);


//Validación de la cédula de identidad
document.getElementById("usuarioPersonal").addEventListener(
    "input",
    function () {

        this.value =
            this.value.replace(/[^0-9]/g, "");

    }
);

//Funcion para manejar los clics dentro de la tabla de productos
document.getElementById("tablaProductos").addEventListener(
    "click",
    function (e) {

        let fila = e.target.closest("tr");


        if(!fila || fila.rowIndex === 0){

            return;

        }


        //EN MODO EDICIÓN

        if(modoEditar){

            if (!fila || fila.rowIndex === 0) {

                return;

            }


            if (modoEditar) {

                filaSeleccionada = fila;


                document.getElementById("producto").value =
                    fila.cells[1].textContent;


                document.getElementById("precio").value =
                    fila.cells[2].textContent.replace("$","");


                document.getElementById("stock").value =
                    fila.cells[3].textContent;


                document.getElementById("umbral").value =
                    fila.cells[4].textContent;


                document.getElementById("descripcion").value =
                    fila.cells[6].textContent === "Sin descripción"
                    ? ""
                    : fila.cells[6].textContent;


                document.getElementById("btnAgregar").textContent =
                    "Guardar cambios";

            }

        }


        //EN MODO ELIMINACIÓN

        if (modoEliminar) {

            const alerta =
                document.getElementById("alertaEliminar");


            alerta.classList.remove("d-none");

            alerta.classList.add("d-flex");


            document.getElementById("btnSi").onclick = function() {

                fila.remove();

                actualizarNumeros();

                mostrarExito(
                    "Producto eliminado correctamente."
                );

                alerta.classList.replace(
                    "d-flex",
                    "d-none"
                );

            };


            document.getElementById("btnNo").onclick = function() {

                alerta.classList.replace(
                    "d-flex",
                    "d-none"
                );

            };

        }

    }
);

//Función para manejar los clics dentro de la tabla de personal
document.getElementById("tablaPersonal").addEventListener(
    "click",
    function (e) {

        let fila = e.target.closest("tr");


        if(!fila || fila.rowIndex === 0){

            return;

        }


        //Si estamos en modo eliminación
        if(modoEliminarPersonal){

            seleccionarFilaPersonal(fila);

        }

    }
);


//Comprueba los productos que ya estaban escritos en la tabla al cargar la página
comprobarTodosLosStocks();