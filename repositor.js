let modoEditar = false;
let productosCache = [];

function mostrarExito(mensaje) {
    document.getElementById("mensajeExito").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function mostrarAdvertencia(mensaje) {
    document.getElementById("mensajeAdvertencia").innerHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina(["repositor", "administrador"]);
    if (!usuario) return;

    await cargarProductos();
});

async function cargarProductos() {
    try {
        const datos = await apiFetch("/productos.php");
        productosCache = datos.productos;
        renderizarTabla(productosCache);
    } catch (error) {
        mostrarAdvertencia("No se pudieron cargar los productos: " + error.message);
    }
}

function renderizarTabla(productos) {
    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";

    productos.forEach((producto) => {
        const fila = document.createElement("tr");
        fila.dataset.id = producto.id;

        const celdaImagen = producto.imagen
            ? `<img src="${API_BASE}/imagen.php?id=${producto.id}" alt="${producto.nombre}" style="max-width:60px;max-height:60px;object-fit:cover;border-radius:6px;">`
            : "Sin imagen";

        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td>${producto.stock}</td>
            <td>${producto.umbral_minimo}</td>
            <td>${celdaImagen}</td>
            <td>${producto.descripcion || "Sin descripción"}</td>
        `;
        tbody.appendChild(fila);
    });

    comprobarTodosLosStocks();
}

function buscarProducto() {
    let filtro = document.getElementById("buscarProducto").value.toLowerCase();
    let filas = document.querySelectorAll("#tablaProductos tbody tr");

    filas.forEach((fila) => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(filtro) ? "" : "none";
    });
}

function comprobarStock(fila) {
    let stock = Number(fila.cells[2].textContent);
    let umbral = Number(fila.cells[3].textContent);
    fila.cells[2].classList.toggle("stock-bajo", stock < umbral);
}

function comprobarTodosLosStocks() {
    document.querySelectorAll("#tablaProductos tbody tr").forEach(comprobarStock);
}

function activarModoEditar() {
    if (modoEditar) {
        // Cancelar: recarga desde el backend, descartando cambios sin guardar
        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");
        cargarProductos();
        mostrarAdvertencia("Cambios de stock descartados.");
        return;
    }

    modoEditar = true;
    document.getElementById("btnEditar").textContent = "Cancelar";
    document.getElementById("btnEditar").className = "btn btn-danger px-4 py-2 fs-6 mx-3";
    document.getElementById("tablaProductos").classList.add("modo-edicion");
    convertirCeldasAStockEditables();
}

function convertirCeldasAStockEditables() {
    document.querySelectorAll("#tablaProductos tbody tr").forEach((fila) => {
        const stockActual = fila.cells[2].textContent;
        fila.cells[2].innerHTML = `<input type="text" value="${stockActual}" class="stock-input" style="border: 2px solid #28a745; border-radius: 4px; padding: 4px 8px; width: 80px; text-align: center; font-size: 16px; background-color: white;">`;
    });

    document.querySelectorAll(".stock-input").forEach((input) => {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, "");
            if (this.value.length > 1) this.value = this.value.replace(/^0+/, "");
            if (this.value.length > 8) this.value = this.value.slice(0, 8);
        });

        input.addEventListener("blur", function () {
            if (this.value === "" || isNaN(parseInt(this.value))) this.value = 0;
        });

        input.addEventListener("click", (e) => e.stopPropagation());

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                guardarYSalirEdicion();
            }
        });
    });
}

async function guardarYSalirEdicion() {
    if (!modoEditar) return;

    const filas = document.querySelectorAll("#tablaProductos tbody tr");
    const actualizaciones = [];

    filas.forEach((fila) => {
        const input = fila.cells[2].querySelector("input");
        if (input) {
            actualizaciones.push({ id: fila.dataset.id, stock: parseInt(input.value) || 0 });
        }
    });

    try {
        await Promise.all(
            actualizaciones.map((a) =>
                apiFetch(`/productos.php?id=${a.id}`, {
                    method: "PATCH",
                    body: { stock: a.stock },
                })
            )
        );

        modoEditar = false;
        document.getElementById("btnEditar").textContent = "Editar";
        document.getElementById("btnEditar").className = "btn btn-success px-4 py-2 fs-6 mx-3";
        document.getElementById("tablaProductos").classList.remove("modo-edicion");

        await cargarProductos();
        mostrarExito("Stock actualizado correctamente.");
    } catch (error) {
        mostrarAdvertencia("No se pudo guardar el stock: " + error.message);
    }
}
