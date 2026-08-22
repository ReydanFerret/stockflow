//Declaracion de variables
let contador = 4;
let modoEditar = false;
let modoEliminar = false;
let filaSeleccionada = null;

//Esta función toma los div con id "mensajeError" y le agrega ciertas clases de bootstrap y el rol
//de alert, además agrega un boton para cerrar la alerta
function mostrarError(mensaje) {
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

//Funcion para buscar productos dentro de la tabla de estos
function buscarProducto(){
    //Declaración de variables de la tabla de productos, la barra de busqueda de los mismos
    //y las filas de las tablas
    let filtro = document.getElementById("buscarProducto").value.toLowerCase();
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    //Recorre las filas y asigna a la celda 1 el nombre del producto, en la celda 2 el precio
    //y el stock en la celda 3, todo esto saltandose la primera fila porque es el encabezado de la tabla
    //ademas obtiene el contenido de las filas y lo pasa a minusculas
    for(let i = 1; i < filas.length; i++){
        let producto = filas[i].cells[1].textContent.toLowerCase();
        let precio = filas[i].cells[2].textContent.toLowerCase();
        let stock = filas[i].cells[3].textContent.toLowerCase();

        //Compara si el texto del buscador está incluido en el producto, precio o stock.
        //si hay coincidencia muestra la fila, si no hay coincidencia la oculta de la pantalla.
        if(
            producto.includes(filtro) ||
            precio.includes(filtro) ||
            stock.includes(filtro)
        ){
            filas[i].style.display = "";
        }else{
            filas[i].style.display = "none";
        }
    }
}
//Función para activar o desactivar el modo de edición de productos
function activarModoEditar(){
    //Si el modo edición ya está activo, se desactiva
    if(modoEditar){

        //Cambia el estado a falso para indicar que ya no se está editando
        modoEditar = false;

        //Restaura el texto original del botón de edición
        document.getElementById("btnEditar").textContent = "Editar";

        //Quita los estilos visuales de edición a la tabla
        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        //Restaura el texto original del botón para añadir nuevos productos
        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        //Limpia la variable para que no quede ninguna fila seleccionada para editar
        filaSeleccionada = null;

        //Limpia todos los inputs dentro del div al cancelar la edicion
        const inputs = document.querySelectorAll(".agregar-producto input");
        inputs.forEach(input => input.value = "");

        //Sale de la función inmediatamente para no ejecutar el código de abajo
        return;
    }

    //Si el modo edición estaba desactivado se activa y se desactiva el modo eliminar
    modoEditar = true;
    modoEliminar = false;

    //Cambia el texto del botón a "Cancelar" por si el usuario se arrepiente de editar
    document.getElementById("btnEditar").textContent = "Cancelar";

    //Restaura el texto del botón de eliminar a su estado normal
    document.getElementById("btnEliminar").textContent = "Eliminar";

    //Aplica los estilos visuales de edición a la tabla
    document.getElementById("tablaProductos").classList.add("modo-edicion");

    //Quita los estilos visuales del modo eliminar para evitar conflictos visuales
    document.getElementById("tablaProductos").classList.remove("modo-eliminar");
}

//Función para activar o desactivar el modo de eliminación de productos
function activarModoEliminar(){
    //Si el modo eliminación ya está activo, se desactiva
    if(modoEliminar){
        //Cambia el estado a falso para indicar que ya no se está eliminando
        modoEliminar = false;

        //Restaura el texto del botón a su estado original
        document.getElementById("btnEliminar").textContent = "Eliminar";

        //Quita  los estilos visuales relacionado al modo de eliminación
        document.getElementById("tablaProductos").classList.remove("modo-eliminar");

        //Sale de la función para que no se ejecute el codigo de más abajo
        return;
    }

    //Si el modo de eliminación estaba desactivado se activa y se desactiva el modo de edición
    modoEliminar = true;
    modoEditar = false;

    //Cambia el texto del botón a "Cancelar" por si el usuario decide no borrar nada
    document.getElementById("btnEliminar").textContent = "Cancelar";

    //Restaura el texto del botón de edición a su estado normal
    document.getElementById("btnEditar").textContent = "Editar";

    //Asegura que el botón de agregar muestre su texto original por si estaba en modo edición
    document.getElementById("btnAgregar").textContent = "Agregar Producto";

    //Aplica los estilos visuales de eliminación a la tabla
    document.getElementById("tablaProductos").classList.add("modo-eliminar");

    //Quita los estilos del modo edición para evitar confusiones visuales en la tabla
    document.getElementById("tablaProductos").classList.remove("modo-edicion");

    //Limpia cualquier fila que estuviera seleccionada para editar anteriormente
    filaSeleccionada = null;
}

//Función para recalcular y actualizar la numeración de las filas en la tabla
function actualizarNumeros(){

    //Obtiene todas las filas de la tabla de productos, incluyendo el encabezado
    let filas = document.getElementById("tablaProductos").rows;

    //Recorre las filas una a una empezando desde la 1 para no tocar el encabezado
    for(let i = 1; i < filas.length; i++){

        //Asigna el número de la posición actual (i) como texto en la primera celda (columna 0)
        filas[i].cells[0].textContent = i;
    }
    
    //Actualiza el contador global con el total de filas para llevar el control del próximo numero de producto
    contador = filas.length;
}


//Función para registrar un nuevo producto en la tabla o guardar los cambios del modo edición
function agregarProducto() {

    //Captura los valores de los campos del formulario limpiando 
    //espacios en blanco extra (es decir si hay mas de un espacio)
    //y guardando el archivo de imagen
    let producto = document.getElementById("producto").value.trim();
    let precio = document.getElementById("precio").value;
    let stock = document.getElementById("stock").value;
    let imagen = document.getElementById("imagen").files[0];
    let descripcion = document.getElementById("descripcion").value.trim();

    //Valida que los campos obligatorios (producto, precio y stock) no estén vacíos
    if (producto === "" || precio === "" || stock === "") {
        mostrarError("Producto, Precio y Stock no pueden estar vacíos.");
        return;
    }

    //Valida que los números ingresados en precio y stock no sean menores a cero
    if (precio < 0 || stock < 0) {
        mostrarError("Precio y Stock no pueden ser negativos.");
        return;
    }

    //Valida que el archivo subido sea realmente una imagen comprobando su tipo
    if (imagen && !imagen.type.startsWith("image/")) {
        mostrarError("Solo se permiten archivos de imagen.");
        document.getElementById("imagen").value = ""; //Limpia el campo de archivo inválido
        return;
    }

    //SECCIÓN DE EDICIÓN
    //Si el modo edición está activo y hay una fila seleccionada previamente, se sobreescriben sus datos
    if(modoEditar && filaSeleccionada){

        //Actualiza el texto de las celdas con la nueva información del formulario
        filaSeleccionada.cells[1].textContent = producto;
        filaSeleccionada.cells[2].textContent = "$" + precio;
        filaSeleccionada.cells[3].textContent = stock;
        filaSeleccionada.cells[5].textContent = descripcion || "Sin descripción";

        //Si el usuario subió una nueva imagen durante la edición, reemplaza la anterior
        if(imagen){
            let url = URL.createObjectURL(imagen); //Crea una ruta temporal para la nueva imagen
            filaSeleccionada.cells[4].innerHTML = `<img src="${url}" width="80" alt="Imagen del producto">`;
        }

        //Limpia todos los campos del formulario para dejarlos vacíos
        document.getElementById("producto").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("imagen").value = "";
        document.getElementById("descripcion").value = "";

        //Reinicia las variables de control y desactiva el modo de edición
        filaSeleccionada = null;
        modoEditar = false;

        //Quita los estilos visuales de edición a la tabla
        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        //Restaura los textos de los botones a sus nombres originales
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        //Informa al usuario que la edición fue exitosa y sale de la función
        mostrarExito("Producto actualizado correctamente.");
        return;
    }

    //SECCIÓN DE CREACIÓN
    //Si no se estaba editando, se procede a insertar un nuevo producto al final de la tabla
    let tabla = document.getElementById("tablaProductos");
    let fila = tabla.insertRow(); //Crea una nueva fila HTML

    //Inserta y rellena las primeras celdas (Numero de producto, Nombre, Precio y Stock)
    fila.insertCell(0).innerHTML = contador++; //Asigna el numero de producto actual e incrementa el contador global
    fila.insertCell(1).innerHTML = producto;
    fila.insertCell(2).innerHTML = "$" + precio;
    fila.insertCell(3).innerHTML = stock;

    //Crea la celda destinada a la imagen del producto
    let celdaImagen = fila.insertCell(4);

    //Si se seleccionó una imagen, crea su URL temporal y la dibuja dentro de la celda
    if (imagen) {
        let url = URL.createObjectURL(imagen);
        celdaImagen.innerHTML = `<img src="${url}" width="80" alt="Imagen del producto">`;
    } else {
        //Si no hay archivo, coloca un texto por defecto
        celdaImagen.innerHTML = "Sin imagen";
    }

    //Inserta la celda de descripción asignando un texto alternativo si quedó vacía
    fila.insertCell(5).innerHTML = descripcion || "Sin descripción";

    //Limpia todos los campos del formulario para permitir un nuevo registro rápido
    document.getElementById("producto").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("imagen").value = "";
    document.getElementById("descripcion").value = "";
}

//Escucha los clics dentro de la tabla de productos para capturar la fila seleccionada
document.getElementById("buscarProducto").addEventListener("keyup", buscarProducto);

document.getElementById("btnEditar").addEventListener("click", activarModoEditar);

document.getElementById("btnEliminar").addEventListener("click", activarModoEliminar);

document.getElementById("btnAgregar").addEventListener("click", agregarProducto);

document.getElementById("producto").addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ."()]/g, "");
});

document.getElementById("precio").addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("stock").addEventListener("input", function () {
    this.value = this.value.replace(/[^0-9]/g, "");
});

document.getElementById("tablaProductos").addEventListener("click", function (e) {

    //Encuentra la fila (tr) más cercana al elemento exacto donde el usuario hizo clic
    let fila = e.target.closest("tr");

    //Si no se hizo clic en una fila, o si se hizo clic en la fila 0 (encabezado), detiene la función
    if(!fila || fila.rowIndex === 0){
        return;
    }

    //EN MODO EDICIÓN
    //Si el modo edición está encendido, carga los datos de esa fila en el formulario
    if(modoEditar){
    if (!fila || fila.rowIndex === 0) {
        return;
    }

    if (modoEditar) {

        //Guarda la fila clickeada en la variable global para saber cuál vamos a actualizar después
        filaSeleccionada = fila;

        //Pasa el nombre del producto desde la celda 1 al campo de texto del formulario
        document.getElementById("producto").value = fila.cells[1].textContent;

        //Pasa el precio quitando el símbolo "$" para dejar solo el número puro
        document.getElementById("precio").value = fila.cells[2].textContent.replace("$","");

        //Pasa la cantidad de stock disponible al formulario
        document.getElementById("stock").value = fila.cells[3].textContent;

        //Pasa la descripción; si dice "Sin descripción" borra el campo, si no, copia el texto real
        document.getElementById("descripcion").value =
            fila.cells[5].textContent === "Sin descripción"
            ? ""
            : fila.cells[5].textContent;

        //Cambia el texto del botón principal para indicar que ahora guardará cambios en vez de crear
        document.getElementById("btnAgregar").textContent = "Guardar cambios";
    }

    //EN MODO ELIMINACIÓN
    //Si el modo eliminación está encendido, abre el cuadro de confirmación personalizado
    if (modoEliminar) {
        
        //Captura el elemento HTML que funciona como ventana de alerta
        const alerta = document.getElementById('alertaEliminar');
        
        //Muestra la alerta quitando la clase que la oculta y agrega display flex
        alerta.classList.remove('d-none');
        alerta.classList.add('d-flex');

        //Configura la acción que ocurrirá si el usuario presiona el botón "Sí"
        document.getElementById('btnSi').onclick = function() {
            fila.remove(); //Borra físicamente la fila seleccionada de la tabla HTML
            actualizarNumeros(); //Recalcula la numeración (1, 2, 3...) de todas las filas restantes
            mostrarExito("Producto eliminado correctamente."); //Muestra un mensaje verde de éxito
            alerta.classList.replace('d-flex', 'd-none'); //Esconde la alerta cambiando sus clases visuales
        };

        //Configura la acción que ocurrirá si el usuario presiona el botón "No"
        document.getElementById('btnNo').onclick = function() {
            alerta.classList.replace('d-flex', 'd-none'); //Cierra la alerta sin borrar nada
        };
     }
    }
});
