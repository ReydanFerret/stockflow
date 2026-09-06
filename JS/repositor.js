//Indica que está descativado actualmente el modo de edición de stock
let modoEditar = false;

//Guarda los valores de stock originales antes de editar, por si el usuario cancela
let valoresOriginalesStock = [];

//Funciones para mostrar mensajes
//Muestra un mensaje de éxito dentro del contenedor con id mensajeExito
function mostrarExito(mensaje) {
    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

//Muestra un mensaje de advertencia dentro del contenedor con id mensajeAdvertencia
//añade clases al div y ademas genera un boton de cierre
function mostrarAdvertencia(mensaje) {
    document.getElementById("mensajeAdvertencia").innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

//Búsqueda de productos en la tabla

//Filtra las filas de la tabla según el texto ingresado en el input de búsqueda.
//compara contra el nombre del producto, el precio y el stock (columnas 1, 2 y 3).
function buscarProducto() {
    let filtro = document.getElementById("buscarProducto").value.toLowerCase();
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    //Empieza en i=1 para saltar la fila de encabezado
    for (let i = 1; i < filas.length; i++) {
        let producto = filas[i].cells[1].textContent.toLowerCase();
        let precio = filas[i].cells[2].textContent.toLowerCase();
        let stock = filas[i].cells[3].textContent.toLowerCase();

        //Si el filtro coincide con alguno de los tres campos, se muestra la fila;
        //si no coincide con ninguno, se oculta
        if (producto.includes(filtro) || precio.includes(filtro) || stock.includes(filtro)) {
            filas[i].style.display = "";
        } else {
            filas[i].style.display = "none";
        }
    }
}

//Funcion para comprobar si el stock está por debajo del umbral mínimo
function comprobarStock(fila) {

    let stock = Number(fila.cells[3].textContent);
    let umbral = Number(fila.cells[4].textContent);

    if (stock < umbral) {
        fila.cells[3].style.backgroundColor = "#fdea7b";
    } else {
        fila.cells[3].style.backgroundColor = "";
    }
}

//Funcion para comprobar el stock de todos los productos existentes
function comprobarTodosLosStocks() {

    let filas = document.querySelectorAll("#tablaProductos tbody tr");

    filas.forEach(function(fila) {
        comprobarStock(fila);
    });
}

//Activar o cancelar el modo edición

//Alterna entre modo edición y modo normal.

//Si ya está en modo edición, la función actúa como "Cancelar":
//descarta los cambios de stock y vuelve al estado normal.

//Si no está en modo edición, la activa: guarda los valores originales
//de stock y convierte las celdas en editables.
function activarModoEditar() {
    if (modoEditar) {
        //Cancelar
        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");
        restaurarCeldasTexto(false);
        comprobarTodosLosStocks();
        mostrarAdvertencia("Cambios de stock descartados.");
        return;
    }

    //Activar edición
    guardarValoresOriginalesStock();
    modoEditar = true;
    document.getElementById("btnEditar").textContent = "Cancelar";
    document.getElementById("btnEditar").className = "btn btn-danger px-4 py-2 fs-6 mx-3";
    document.getElementById("tablaProductos").classList.add("modo-edicion");
    convertirCeldasAStockEditables();
}

//Recorre la tabla y guarda en un array (valoresOriginalesStock) el texto actual
//de la columna de stock de cada fila, para poder restaurarlo si se cancela la edición
function guardarValoresOriginalesStock() {
    valoresOriginalesStock = [];
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let stock = filas[i].cells[3].textContent;
        valoresOriginalesStock.push(stock);
    }
}

//Conversión de celdas a modo editable

//Convierte cada fila de la tabla para el modo edición:

//Las columnas que NO son editables (producto, precio, imagen, descripción)
//se envuelven en un <span class="texto-fijo"> para congelar su contenido
//visualmente mientras dura la edición.

//La columna de stock (columna 3) se reemplaza por un <input type="text">
//editable, con estilo verde.

//También se agregan los listeners de validación a cada input de stock.
function convertirCeldasAStockEditables() {
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let fila = filas[i];

        //Columna 1: nombre del producto se fija como texto (no editable)
        let producto = fila.cells[1].textContent;
        fila.cells[1].innerHTML = `<span class="texto-fijo">${producto}</span>`;

        //Columna 2: precio se fija como texto (no editable)
        let precio = fila.cells[2].textContent;
        fila.cells[2].innerHTML = `<span class="texto-fijo">${precio}</span>`;

        //Columna 3: stock se convierte en un input editable
        let stockActual = fila.cells[3].textContent;
        fila.cells[3].style.backgroundColor = "";
        fila.cells[3].innerHTML = `<input type="text" value="${stockActual}" class="stock-input" style="border: 2px solid #28a745; border-radius: 4px; padding: 4px 8px; width: 80px; text-align: center; font-size: 16px; background-color: white;">`;

        //Columna 4: umbral mínimo se fija como texto
        let umbral = fila.cells[4].textContent;
        fila.cells[4].innerHTML = `<span class="texto-fijo">${umbral}</span>`;

        //Columna 5: imagen (o texto si no hay imagen) se fija, distinguiendo
        //si contiene una etiqueta <img> para mantener el HTML de la imagen intacto
        let imagenHtml = fila.cells[5].innerHTML;
        if (imagenHtml.includes('<img')) {
            fila.cells[5].innerHTML = `<span class="texto-fijo-imagen">${imagenHtml}</span>`;
        } else {
            fila.cells[5].innerHTML = `<span class="texto-fijo">${fila.cells[5].textContent}</span>`;
        }

        //Columna 6: descripción se fija como texto (no editable)
        let descripcion = fila.cells[6].textContent;
        fila.cells[6].innerHTML = `<span class="texto-fijo">${descripcion}</span>`;
    }

    //Agrega los eventos de validación a todos los inputs de stock recién creados
    document.querySelectorAll('.stock-input').forEach(input => {

        //Mientras el usuario escribe: solo permite dígitos (0-9),
        //no permite valores negativos y limita a 8 caracteres
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');

            if (this.value.length > 1) {
                this.value = this.value.replace(/^0+/, "");
            }

            if (parseInt(this.value) < 0) {
                this.value = 0;
            }

            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }
        });

        //Al perder el foco si el campo quedó vacío o no es un número válido,
        //lo resetea a 0. También evita valores negativos.
        input.addEventListener('blur', function(e) {
            if (this.value === '' || isNaN(parseInt(this.value))) {
                this.value = 0;
            }

            if (parseInt(this.value) < 0) {
                this.value = 0;
            }
        });

        //Sin esto al presionar editar no deja editar los campos de stock, es decir que
        //no se vuelven editables
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        //Si el usuario presiona Enter dentro del input, guarda los cambios
        //y sale del modo edición automáticamente (puede guardar los de varios inputs editados)
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarYSalirEdicion();
            }
        });
    });
}

//Guardar cambios y salir del modo edición

//Guarda los cambios de stock, desactiva el modo edición, actualiza el botón,
//restaura las celdas a texto plano (con los nuevos valores) y muestra un mensaje de éxito
function guardarYSalirEdicion() {
    if (modoEditar) {
        guardarCambiosStock();
        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");
        restaurarCeldasTexto(true);
        comprobarTodosLosStocks();
        mostrarExito("Stock actualizado correctamente.");
    }
}

//Restaurar las celdas de vuelta a texto plano

//Deshace la conversión hecha por convertirCeldasAStockEditables():
//vuelve a dejar todas las celdas como texto simple.

//El parámetro guardarCambios determina qué valor de stock queda:
//- true  -> usa el valor que el usuario escribió en el input
//- false -> usa el valor original guardado antes de editar (se cancela la edición)

function restaurarCeldasTexto(guardarCambios) {
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let fila = filas[i];

        //Restaura el nombre del producto desde el span.texto-fijo
        let productoSpan = fila.cells[1].querySelector('.texto-fijo');
        if (productoSpan) {
            fila.cells[1].textContent = productoSpan.textContent;
        }

        //Restaura el precio desde el span.texto-fijo
        let precioSpan = fila.cells[2].querySelector('.texto-fijo');
        if (precioSpan) {
            fila.cells[2].textContent = precioSpan.textContent;
        }

        //Restaura el stock: toma el valor del input y decide si usar
        //el nuevo valor ingresado o el valor original
        let stockInput = fila.cells[3].querySelector('input');
        if (stockInput) {
            if (guardarCambios) {
                let nuevoStock = parseInt(stockInput.value);

                if (!isNaN(nuevoStock) && nuevoStock >= 0) {
                    fila.cells[3].textContent = nuevoStock;
                } else {
                    fila.cells[3].textContent = 0;
                }
            } else {
                fila.cells[3].textContent = valoresOriginalesStock[i - 1];
            }
        }

        //Restaura el umbral mínimo desde el span.texto-fijo
        let umbralSpan = fila.cells[4].querySelector('.texto-fijo');
        if (umbralSpan) {
            fila.cells[4].textContent = umbralSpan.textContent;
        }

        //Restaura la columna de imagen: si había una imagen, recupera su HTML;
        //si era solo texto, recupera el texto
        let imagenSpan = fila.cells[5].querySelector('.texto-fijo-imagen');
        if (imagenSpan) {
            fila.cells[5].innerHTML = imagenSpan.innerHTML;
        } else {
            let imagenSpanTexto = fila.cells[5].querySelector('.texto-fijo');
            if (imagenSpanTexto) {
                fila.cells[5].textContent = imagenSpanTexto.textContent;
            }
        }

        //Restaura la descripción desde el span.texto-fijo
        let descripcionSpan = fila.cells[6].querySelector('.texto-fijo');
        if (descripcionSpan) {
            fila.cells[6].textContent = descripcionSpan.textContent;
        }
    }
}

//Guardar los cambios de stock

//Recorre todas las filas y, para cada input de stock válido (número >= 0),
//reemplaza el contenido de la celda por el nuevo valor numérico.
function guardarCambiosStock() {
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let fila = filas[i];
        let stockInput = fila.cells[3].querySelector('input');

        if (stockInput) {
            let nuevoStock = parseInt(stockInput.value);

            if (!isNaN(nuevoStock) && nuevoStock >= 0) {
                fila.cells[3].textContent = nuevoStock;
            }
        }
    }
}

//Comprueba los productos que ya estaban escritos en la tabla al cargar la página
comprobarTodosLosStocks();