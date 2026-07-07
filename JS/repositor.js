let modoEditar = false;
let valoresOriginalesStock = [];

function mostrarError(mensaje) {
    document.getElementById("mensajeError").innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function mostrarExito(mensaje) {
    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function mostrarAdvertencia(mensaje) {
    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function buscarProducto() {
    let filtro = document.getElementById("buscarProducto").value.toLowerCase();
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let producto = filas[i].cells[1].textContent.toLowerCase();
        let precio = filas[i].cells[2].textContent.toLowerCase();
        let stock = filas[i].cells[3].textContent.toLowerCase();

        if (producto.includes(filtro) || precio.includes(filtro) || stock.includes(filtro)) {
            filas[i].style.display = "";
        } else {
            filas[i].style.display = "none";
        }
    }
}

function activarModoEditar() {
    if (modoEditar) {
        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");
        restaurarCeldasTexto(false);
        mostrarAdvertencia("Cambios de stock descartados.");
        return;
    }

    guardarValoresOriginalesStock();
    modoEditar = true;
    document.getElementById("btnEditar").textContent = "Cancelar";
    document.getElementById("btnEditar").className = "btn btn-danger px-4 py-2 fs-6 mx-3";
    document.getElementById("tablaProductos").classList.add("modo-edicion");
    convertirCeldasAStockEditables();
}

function guardarValoresOriginalesStock() {
    valoresOriginalesStock = [];
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let stock = filas[i].cells[3].textContent;
        valoresOriginalesStock.push(stock);
    }
}

function convertirCeldasAStockEditables() {
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let fila = filas[i];
        
        let producto = fila.cells[1].textContent;
        fila.cells[1].innerHTML = `<span class="texto-fijo">${producto}</span>`;
        
        let precio = fila.cells[2].textContent;
        fila.cells[2].innerHTML = `<span class="texto-fijo">${precio}</span>`;
        
        let stockActual = fila.cells[3].textContent;
        fila.cells[3].innerHTML = `<input type="text" value="${stockActual}" class="stock-input" style="border: 2px solid #28a745; border-radius: 4px; padding: 4px 8px; width: 80px; text-align: center; font-size: 16px; background-color: white;">`;
        
        let imagenHtml = fila.cells[4].innerHTML;
        if (imagenHtml.includes('<img')) {
            fila.cells[4].innerHTML = `<span class="texto-fijo-imagen">${imagenHtml}</span>`;
        } else {
            fila.cells[4].innerHTML = `<span class="texto-fijo">${fila.cells[4].textContent}</span>`;
        }
        
        let descripcion = fila.cells[5].textContent;
        fila.cells[5].innerHTML = `<span class="texto-fijo">${descripcion}</span>`;
    }

    document.querySelectorAll('.stock-input').forEach(input => {
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (parseInt(this.value) < 0) {
                this.value = 0;
            }
            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }
        });

        input.addEventListener('blur', function(e) {
            if (this.value === '' || isNaN(parseInt(this.value))) {
                this.value = 0;
            }
            if (parseInt(this.value) < 0) {
                this.value = 0;
            }
        });

        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarYSalirEdicion();
            }
        });
    });
}

function guardarYSalirEdicion() {
    if (modoEditar) {
        guardarCambiosStock();
        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");
        restaurarCeldasTexto(true);
        mostrarExito("Stock actualizado correctamente.");
    }
}

function restaurarCeldasTexto(guardarCambios) {
    let tabla = document.getElementById("tablaProductos");
    let filas = tabla.getElementsByTagName("tr");

    for (let i = 1; i < filas.length; i++) {
        let fila = filas[i];
        
        let productoSpan = fila.cells[1].querySelector('.texto-fijo');
        if (productoSpan) {
            fila.cells[1].textContent = productoSpan.textContent;
        }

        let precioSpan = fila.cells[2].querySelector('.texto-fijo');
        if (precioSpan) {
            fila.cells[2].textContent = precioSpan.textContent;
        }

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

        let imagenSpan = fila.cells[4].querySelector('.texto-fijo-imagen');
        if (imagenSpan) {
            fila.cells[4].innerHTML = imagenSpan.innerHTML;
        } else {
            let imagenSpanTexto = fila.cells[4].querySelector('.texto-fijo');
            if (imagenSpanTexto) {
                fila.cells[4].textContent = imagenSpanTexto.textContent;
            }
        }

        let descripcionSpan = fila.cells[5].querySelector('.texto-fijo');
        if (descripcionSpan) {
            fila.cells[5].textContent = descripcionSpan.textContent;
        }
    }
}

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