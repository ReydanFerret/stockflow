let contador = 4;

let modoEditar = false;
let modoEliminar = false;
let filaSeleccionada = null;

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
            filas[i].style.display = "";
        }else{
            filas[i].style.display = "none";
        }
    }
}

function activarModoEditar(){

    if(modoEditar){

        modoEditar = false;

        document.getElementById("btnEditar").textContent = "Editar";

        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        filaSeleccionada = null;

        return;
    }

    modoEditar = true;
    modoEliminar = false;

    document.getElementById("btnEditar").textContent = "Cancelar";

    document.getElementById("btnEliminar").textContent = "Eliminar";

    document.getElementById("tablaProductos").classList.add("modo-edicion");

    document.getElementById("tablaProductos").classList.remove("modo-eliminar");
}

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

function actualizarNumeros(){

    let filas = document.getElementById("tablaProductos").rows;

    for(let i = 1; i < filas.length; i++){

        filas[i].cells[0].textContent = i;

    }

    contador = filas.length;
}

function agregarProducto() {

    let producto = document.getElementById("producto").value.trim();
    let precio = document.getElementById("precio").value;
    let stock = document.getElementById("stock").value;
    let imagen = document.getElementById("imagen").files[0];
    let descripcion = document.getElementById("descripcion").value.trim();

    if (producto === "" || precio === "" || stock === "") {
        mostrarError("Producto, Precio y Stock no pueden estar vacíos.");
        return;
    }

    if (precio < 0 || stock < 0) {
        mostrarError("Precio y Stock no pueden ser negativos.");
        return;
    }

    if (imagen && !imagen.type.startsWith("image/")) {
        mostrarError("Solo se permiten archivos de imagen.");
        document.getElementById("imagen").value = "";
        return;
    }

    if(modoEditar && filaSeleccionada){

        filaSeleccionada.cells[1].textContent = producto;
        filaSeleccionada.cells[2].textContent = "$" + precio;
        filaSeleccionada.cells[3].textContent = stock;
        filaSeleccionada.cells[5].textContent =
            descripcion || "Sin descripción";

        if(imagen){

            let url = URL.createObjectURL(imagen);

            filaSeleccionada.cells[4].innerHTML =
                `<img src="${url}" width="80" alt="Imagen del producto">`;
        }

        document.getElementById("producto").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("imagen").value = "";
        document.getElementById("descripcion").value = "";

        filaSeleccionada = null;

        modoEditar = false;

        document.getElementById("tablaProductos")
            .classList.remove("modo-edicion");

        document.getElementById("btnEditar").textContent = "Editar";

        document.getElementById("btnAgregar").textContent =
            "Agregar Producto";

        mostrarExito("Producto actualizado correctamente.");

        return;
    }

    let tabla = document.getElementById("tablaProductos");
    let fila = tabla.insertRow();

    fila.insertCell(0).innerHTML = contador++;
    fila.insertCell(1).innerHTML = producto;
    fila.insertCell(2).innerHTML = "$" + precio;
    fila.insertCell(3).innerHTML = stock;

    let celdaImagen = fila.insertCell(4);

    if (imagen) {

        let url = URL.createObjectURL(imagen);

        celdaImagen.innerHTML =
            `<img src="${url}" width="80" alt="Imagen del producto">`;

    } else {

        celdaImagen.innerHTML = "Sin imagen";
    }

    fila.insertCell(5).innerHTML =
        descripcion || "Sin descripción";

    document.getElementById("producto").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("imagen").value = "";
    document.getElementById("descripcion").value = "";
}

document.getElementById("tablaProductos").addEventListener("click", function(e){

    let fila = e.target.closest("tr");

    if(!fila || fila.rowIndex === 0){
        return;
    }

    if(modoEditar){

        filaSeleccionada = fila;

        document.getElementById("producto").value =
            fila.cells[1].textContent;

        document.getElementById("precio").value =
            fila.cells[2].textContent.replace("$","");

        document.getElementById("stock").value =
            fila.cells[3].textContent;

        document.getElementById("descripcion").value =
            fila.cells[5].textContent === "Sin descripción"
            ? ""
            : fila.cells[5].textContent;

        document.getElementById("btnAgregar").textContent =
            "Guardar cambios";
    }

if (modoEliminar) {
    const alerta = document.getElementById('alertaEliminar');
    
    alerta.classList.remove('d-none');
    alerta.classList.add('d-flex');

    document.getElementById('btnSi').onclick = function() {
        fila.remove();
        actualizarNumeros();
        mostrarExito("Producto eliminado correctamente.");
        alerta.classList.replace('d-flex', 'd-none'); // Oculta la alerta
    };

    document.getElementById('btnNo').onclick = function() {
        alerta.classList.replace('d-flex', 'd-none'); // Oculta la alerta
    };
}

});