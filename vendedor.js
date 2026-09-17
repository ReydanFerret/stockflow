let productos = []; // se llena con lo que devuelva /productos.php

const selectProducto = document.getElementById("selectProducto");
const cantidad = document.getElementById("cantidad");
const precio = document.getElementById("precio");
const total = document.getElementById("total");
const btnRegistrarVenta = document.getElementById("btnRegistrarVenta");
const tablaVentas = document.querySelector("#tablaVentas tbody");

function mostrarAlerta(mensaje, tipo) {
    const contenedor = document.getElementById("contenedorAlertas");
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
                ${mensaje}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina(["vendedor", "administrador"]);
    if (!usuario) return;

    await cargarProductosParaSelect();
    await cargarHistorialVentas();
});

async function cargarProductosParaSelect() {
    try {
        const datos = await apiFetch("/productos.php");
        productos = datos.productos;

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Seleccione un producto";
        opcionInicial.disabled = true;
        opcionInicial.selected = true;
        selectProducto.appendChild(opcionInicial);

        productos.forEach((producto, indice) => {
            const opcion = document.createElement("option");
            opcion.value = indice; // el índice apunta al array "productos" en memoria
            opcion.textContent = `${producto.nombre} (stock: ${producto.stock})`;
            selectProducto.appendChild(opcion);
        });
    } catch (error) {
        mostrarAlerta("No se pudieron cargar los productos: " + error.message, "danger");
    }
}

async function cargarHistorialVentas() {
    try {
        const datos = await apiFetch("/ventas.php");
        console.log(datos.ventas);

        tablaVentas.innerHTML = "";

        datos.ventas.forEach((venta) => {
            const fila = document.createElement("tr");

            // Formatear fecha
            let fechaFormateada = "Sin fecha";

            if (venta.fecha) {
                const fecha = new Date(venta.fecha);

                if (!isNaN(fecha.getTime())) {
                    fechaFormateada = fecha.toLocaleDateString("es-UY", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    });
                }
            }

            // Obtener nombre del producto
            const nombreProducto =
                venta.producto_nombre ||
                venta.producto?.nombre ||
                venta.producto ||
                "Sin producto";

            const cantidadVenta = Number(venta.cantidad) || 0;
            const precioUnitario = Number(venta.precio_unitario) || 0;
            const totalVenta = cantidadVenta * precioUnitario;

            fila.innerHTML = `
                <td>${nombreProducto}</td>
                <td>${fechaFormateada}</td>
                <td>${venta.hora || ""}</td>
                <td>${cantidadVenta}</td>
                <td>$${precioUnitario.toFixed(2)}</td>
                <td>$${totalVenta.toFixed(2)}</td>
            `;

            tablaVentas.appendChild(fila);
        });

    } catch (error) {
        console.error(
            "No se pudo cargar el historial de ventas:",
            error
        );
    }
}

selectProducto.addEventListener("change", function () {
    if (this.value === "") {
        precio.value = "";
        total.value = "";
        return;
    }
    precio.value = productos[this.value].precio;
    calcularTotal();
});

cantidad.addEventListener("input", calcularTotal);

function calcularTotal() {
    const cant = Number(cantidad.value);
    const prec = Number(precio.value);
    total.value = cant > 0 && prec > 0 ? cant * prec : "";
}

btnRegistrarVenta.addEventListener("click", async function (e) {
    e.preventDefault();
    document.getElementById("contenedorAlertas").innerHTML = "";

    if (selectProducto.value === "") {
        mostrarAlerta("Seleccione un producto.", "danger");
        return;
    }
    if (cantidad.value === "") {
        mostrarAlerta("Ingrese una cantidad.", "danger");
        return;
    }

    const productoElegido = productos[selectProducto.value];

    try {
        await apiFetch("/ventas.php", {
            method: "POST",
            body: {
                producto_id: productoElegido.id,
                cantidad: Number(cantidad.value),
                precio_unitario: Number(precio.value),
            },
        });

        mostrarAlerta("Venta registrada con éxito.", "success");
        await cargarHistorialVentas();

        selectProducto.selectedIndex = 0;
        cantidad.value = "";
        precio.value = "";
        total.value = "";
    } catch (error) {
        mostrarAlerta("No se pudo registrar la venta: " + error.message, "danger");
    }
});
