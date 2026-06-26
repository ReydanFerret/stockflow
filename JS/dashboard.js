let contador = 4;

let modoEditar = false;
let modoEliminar = false;
let filaSeleccionada = null;

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

    document.getElementById("tablaProductos").classList.add("modo-eliminar");

    document.getElementById("tablaProductos").classList.remove("modo-edicion");

}

function agregarProducto() {

    let producto = document.getElementById("producto").value.trim();
    let precio = document.getElementById("precio").value;
    let stock = document.getElementById("stock").value;
    let imagen = document.getElementById("imagen").files[0];
    let descripcion = document.getElementById("descripcion").value.trim();

    if (producto === "" || precio === "" || stock === "") {
        alert("Producto, Precio y Stock no pueden estar vacíos.");
        return;
    }

    if (precio < 0 || stock < 0) {
        alert("Precio y Stock no pueden ser negativos.");
        return;
    }

    if (imagen && !imagen.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen.");
        document.getElementById("imagen").value = "";
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
        celdaImagen.innerHTML = `<img src="${url}" width="80" alt="Imagen del producto">`;
    } else {
        celdaImagen.innerHTML = "Sin imagen";
    }

    fila.insertCell(5).innerHTML = descripcion || "Sin descripción";

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

        document.getElementById("producto").value = fila.cells[1].textContent;

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

});