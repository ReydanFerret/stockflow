let contador = 4;

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