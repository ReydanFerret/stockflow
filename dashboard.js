let usuarioActual = null;

let productosCache = [];
let modoEliminarProductos = false;
let filaProductoAEliminar = null;
let modoEditarProductos = false;
let productoAEditar = null;


document.addEventListener("DOMContentLoaded", async () => {
    usuarioActual = await protegerPagina(["administrador"]);
    if (!usuarioActual) return; // protegerPagina ya redirigió

    await cargarProductos();
    inicializarEventosProductos();
    inicializarEventosPersonal();
});

// ---------------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------------

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

async function cargarProductos() {
    try {
        const datos = await apiFetch("/productos.php");
        productosCache = datos.productos;
        renderizarTablaProductos(productosCache);
    } catch (error) {
        mostrarError("No se pudieron cargar los productos: " + error.message);
    }
}

function renderizarTablaProductos(productos) {
    const tbody = document.querySelector("#tablaProductos tbody");
    tbody.innerHTML = "";

    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No hay productos cargados todavía.</td></tr>`;
        return;
    }

    productos.forEach((producto) => {
        const fila = document.createElement("tr");
        fila.dataset.id = producto.id;

        const celdaImagen = producto.imagen
            ? `<img src="${API_BASE}/imagen.php?id=${producto.id}" alt="${producto.nombre}" style="width:100%;max-width:150px;height:100px;object-fit:cover;border-radius:6px;">`
            : "Sin imagen";

        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>$${producto.precio}</td>
            <td class="celda-stock">${producto.stock}</td>
            <td>${producto.umbral_minimo}</td>
            <td>${celdaImagen}</td>
            <td>${producto.descripcion || "Sin descripción"}</td>
        `;
        tbody.appendChild(fila);

        const celdaStock = fila.querySelector(".celda-stock");

        if (Number(producto.stock) < Number(producto.umbral_minimo)) {
            celdaStock.classList.add("stock-bajo");
        }
    });
}

function inicializarEventosProductos() {
document.getElementById("btnAgregar").addEventListener("click", async () => {

    const nombre = document.getElementById("producto").value.trim();
    const precio = document.getElementById("precio").value;
    const stock = document.getElementById("stock").value;
    const umbral = document.getElementById("umbral").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const inputImagen = document.getElementById("imagen");
    const archivoImagen = inputImagen.files[0] || null;

    if (nombre === "" || precio === "" || stock === "") {
        mostrarError("Completá al menos producto, precio y stock.");
        return;
    }

    try {

        // -------------------------------------------------------
        // EDITAR PRODUCTO
        // -------------------------------------------------------

        if (modoEditarProductos && productoAEditar) {

            if (archivoImagen) {
                // Con imagen nueva: se manda por POST multipart con
                // _metodo=PATCH, porque PHP no puebla $_FILES en
                // requests PATCH reales.
                const formData = new FormData();
                formData.append("_metodo", "PATCH");
                formData.append("id", productoAEditar.id);
                formData.append("nombre", nombre);
                formData.append("precio", Number(precio));
                formData.append("stock", Number(stock));
                formData.append("umbral_minimo", Number(umbral || 0));
                formData.append("descripcion", descripcion);
                formData.append("imagen", archivoImagen);

                await apiFetch("/productos.php", { method: "POST", body: formData });
            } else {
                // Sin imagen nueva: PATCH + JSON como siempre.
                await apiFetch(`/productos.php?id=${productoAEditar.id}`, {
                    method: "PATCH",
                    body: {
                        nombre,
                        precio: Number(precio),
                        stock: Number(stock),
                        umbral_minimo: Number(umbral || 0),
                        descripcion
                    }
                });
            }

            mostrarExito("Producto actualizado con éxito.");

            productoAEditar = null;
            modoEditarProductos = false;

            document.getElementById("btnEditar").textContent = "Editar";
            document.getElementById("tablaProductos").classList.remove("modo-editar");

        }

        // -------------------------------------------------------
        // AGREGAR PRODUCTO
        // -------------------------------------------------------

        else {

            if (archivoImagen) {
                const formData = new FormData();
                formData.append("nombre", nombre);
                formData.append("precio", Number(precio));
                formData.append("stock", Number(stock));
                formData.append("umbral_minimo", Number(umbral || 0));
                formData.append("descripcion", descripcion);
                formData.append("imagen", archivoImagen);

                await apiFetch("/productos.php", { method: "POST", body: formData });
            } else {
                await apiFetch("/productos.php", {
                    method: "POST",
                    body: {
                        nombre,
                        precio: Number(precio),
                        stock: Number(stock),
                        umbral_minimo: Number(umbral || 0),
                        descripcion
                    }
                });
            }

            mostrarExito("Producto agregado con éxito.");
        }

        // Limpiar campos
        document.getElementById("producto").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("umbral").value = "";
        document.getElementById("descripcion").value = "";
        inputImagen.value = "";

        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        await cargarProductos();

    } catch (error) {

        mostrarError(
            modoEditarProductos
                ? "No se pudo actualizar el producto: " + error.message
                : "No se pudo agregar el producto: " + error.message
        );

    }
});

// ---------------------------------------------------------------
// EDITAR PRODUCTOS
// ---------------------------------------------------------------

document.getElementById("btnEditar").addEventListener("click", function () {

    modoEditarProductos = !modoEditarProductos;

    document.getElementById("tablaProductos").classList.toggle(
        "modo-editar",
        modoEditarProductos
    );

    this.textContent = modoEditarProductos ? "Cancelar" : "Editar";

    if (!modoEditarProductos) {

        productoAEditar = null;

        document.getElementById("producto").value = "";
        document.getElementById("precio").value = "";
        document.getElementById("stock").value = "";
        document.getElementById("umbral").value = "";
        document.getElementById("descripcion").value = "";
        document.getElementById("imagen").value = "";

        document.getElementById("btnAgregar").textContent = "Agregar Producto";

        return;
    }

    mostrarExito("Seleccioná el producto que querés editar.");
});


    document.getElementById("buscarProducto").addEventListener("input", function () {
        const filtro = this.value.toLowerCase();
        document.querySelectorAll("#tablaProductos tbody tr").forEach((fila) => {
            const texto = fila.textContent.toLowerCase();
            fila.style.display = texto.includes(filtro) ? "" : "none";
        });
    });

    // Modo eliminar: activa el modo, y clickeando una fila pide confirmación
    document.getElementById("btnEliminar").addEventListener("click", function () {
        modoEliminarProductos = !modoEliminarProductos;
        document.getElementById("tablaProductos").classList.toggle("modo-eliminar", modoEliminarProductos);
        this.textContent = modoEliminarProductos ? "Cancelar" : "Eliminar";
    });

document.querySelector("#tablaProductos tbody").addEventListener("click", (e) => {

    const fila = e.target.closest("tr");

    if (!fila || !fila.dataset.id) return;


    // -------------------------------------------------------
    // MODO ELIMINAR
    // -------------------------------------------------------

    if (modoEliminarProductos) {

        filaProductoAEliminar = fila;

        document.getElementById("alertaEliminar").classList.remove("d-none");
        document.getElementById("alertaEliminar").classList.add("d-flex");

        return;
    }


    // -------------------------------------------------------
    // MODO EDITAR
    // -------------------------------------------------------

    if (modoEditarProductos) {

        const id = fila.dataset.id;

        const producto = productosCache.find(p => p.id === id);

        if (!producto) {
            mostrarError("No se encontró el producto seleccionado.");
            return;
        }

        productoAEditar = producto;

        document.getElementById("producto").value = producto.nombre;
        document.getElementById("precio").value = producto.precio;
        document.getElementById("stock").value = producto.stock;
        document.getElementById("umbral").value = producto.umbral_minimo || "";
        document.getElementById("descripcion").value = producto.descripcion || "";

        document.getElementById("btnAgregar").textContent = "Guardar cambios";

        mostrarExito("Producto seleccionado. Modificá los datos y guardá los cambios.");
    }

});

    document.getElementById("btnNo").addEventListener("click", () => {
        filaProductoAEliminar = null;
        document.getElementById("alertaEliminar").classList.add("d-none");
    });

    document.getElementById("btnSi").addEventListener("click", async () => {
        if (!filaProductoAEliminar) return;
        const id = filaProductoAEliminar.dataset.id;

        try {
            await apiFetch(`/productos.php?id=${id}`, { method: "DELETE" });
            mostrarExito("Producto eliminado.");
            await cargarProductos();
        } catch (error) {
            mostrarError("No se pudo eliminar: " + error.message);
        } finally {
            document.getElementById("alertaEliminar").classList.add("d-none");
            filaProductoAEliminar = null;
        }
    });
}

// ---------------------------------------------------------------
// PERSONAL
// ---------------------------------------------------------------

let modoEliminarPersonal = false;
let filaPersonalAEliminar = null;

function mostrarErrorPersonal(mensaje) {
    document.getElementById("mensajeErrorPersonal").innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function mostrarExitoPersonal(mensaje) {
    document.getElementById("mensajeExitoPersonal").innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

async function cargarPersonal() {
    try {
        const datos = await apiFetch("/usuarios.php");
        renderizarTablaPersonal(datos.usuarios);
    } catch (error) {
        mostrarErrorPersonal("No se pudo cargar el personal: " + error.message);
    }
}

function renderizarTablaPersonal(usuarios) {
    const tbody = document.querySelector("#tablaPersonal tbody");
    tbody.innerHTML = "";

    if (usuarios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay personal cargado todavía.</td></tr>`;
        return;
    }

    usuarios.forEach((u) => {
        const fila = document.createElement("tr");
        fila.dataset.id = u.id;
        fila.innerHTML = `
            <td>${u.nombre}</td>
            <td>${u.apellido}</td>
            <td>${u.cedula}</td>
            <td>${u.email || "-"}</td>
            <td>${u.telefono || "-"}</td>
            <td>${u.rol}</td>
            <td>${u.estado ? "Activo" : "Inactivo"}</td>
        `;
        tbody.appendChild(fila);
    });
}

function inicializarEventosPersonal() {
    document.getElementById("btnGestionarPersonal").addEventListener("click", async () => {
        document.getElementById("seccionProductos").classList.add("d-none");
        document.getElementById("seccionPersonal").classList.remove("d-none");
        await cargarPersonal();
    });

    document.getElementById("btnVolverProductos").addEventListener("click", () => {
        document.getElementById("seccionPersonal").classList.add("d-none");
        document.getElementById("seccionProductos").classList.remove("d-none");
    });

    document.getElementById("btnAgregarPersonal").addEventListener("click", async () => {
        const nombre = document.getElementById("nombrePersonal").value.trim();
        const apellido = document.getElementById("apellidoPersonal").value.trim();
        const cedula = document.getElementById("usuarioPersonal").value.trim();
        const email = document.getElementById("correoPersonal").value.trim();
        const password = document.getElementById("contrasenaPersonal").value;
        const telefono = document.getElementById("telefonoPersonal").value.trim();
        const rol = document.getElementById("rolPersonal").value.toLowerCase();
        const estado = document.getElementById("estadoPersonal").value;

        if (!nombre || !apellido || !cedula || !password || !rol) {
            mostrarErrorPersonal("Completá nombre, apellido, cédula, contraseña y rol.");
            return;
        }

        try {
            await apiFetch("/usuarios.php", {
                method: "POST",
                body: { nombre, apellido, cedula, email, password, telefono, rol, estado },
            });

            mostrarExitoPersonal("Personal agregado con éxito.");
            document.getElementById("nombrePersonal").value = "";
            document.getElementById("apellidoPersonal").value = "";
            document.getElementById("usuarioPersonal").value = "";
            document.getElementById("correoPersonal").value = "";
            document.getElementById("contrasenaPersonal").value = "";
            document.getElementById("telefonoPersonal").value = "";
            document.getElementById("rolPersonal").value = "";

            await cargarPersonal();
        } catch (error) {
            mostrarErrorPersonal("No se pudo agregar: " + error.message);
        }
    });

    document.getElementById("btnEliminarPersonal").addEventListener("click", function () {
        modoEliminarPersonal = !modoEliminarPersonal;
        document.getElementById("tablaPersonal").classList.toggle("modo-eliminar", modoEliminarPersonal);
        this.textContent = modoEliminarPersonal ? "Cancelar" : "Eliminar Personal";
    });

    document.querySelector("#tablaPersonal tbody").addEventListener("click", (e) => {
        if (!modoEliminarPersonal) return;
        const fila = e.target.closest("tr");
        if (!fila || !fila.dataset.id) return;

        filaPersonalAEliminar = fila;
        document.getElementById("alertaEliminarPersonal").classList.remove("d-none");
        document.getElementById("alertaEliminarPersonal").classList.add("d-flex");
    });

    document.getElementById("btnNoPersonal").addEventListener("click", () => {
        filaPersonalAEliminar = null;
        document.getElementById("alertaEliminarPersonal").classList.add("d-none");
    });

    document.getElementById("btnSiPersonal").addEventListener("click", async () => {
        if (!filaPersonalAEliminar) return;
        const id = filaPersonalAEliminar.dataset.id;

        try {
            await apiFetch(`/usuarios.php?id=${id}`, { method: "DELETE" });
            mostrarExitoPersonal("Personal eliminado.");
            await cargarPersonal();
        } catch (error) {
            mostrarErrorPersonal("No se pudo eliminar: " + error.message);
        } finally {
            document.getElementById("alertaEliminarPersonal").classList.add("d-none");
            filaPersonalAEliminar = null;
        }
    });
}
