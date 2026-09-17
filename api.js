// URL base del backend PHP (Tailscale Funnel, puerto 8443).
// Si el túnel cambia de nombre/puerto, este es el ÚNICO lugar
// que hay que actualizar en todo el frontend.
const API_BASE = "https://stockflow.tail9e5e92.ts.net:8443";

async function apiFetch(ruta, opciones = {}) {
    const esFormData = opciones.body instanceof FormData;

    const config = {
        method: opciones.method || "GET",
        credentials: "include",
        headers: {
            ...(esFormData ? {} : { "Content-Type": "application/json" }),
            ...(opciones.headers || {}),
        },
    };

    if (opciones.body !== undefined) {
        config.body = esFormData ? opciones.body : JSON.stringify(opciones.body);
    }

    let respuesta;
    try {
        respuesta = await fetch(`${API_BASE}${ruta}`, config);
    } catch (errorDeRed) {
        // Esto salta si el backend no responde, o si el navegador
        // bloqueó la petición por CORS.
        throw new Error("No se pudo conectar con el servidor. Verificá tu conexión.");
    }

    let cuerpo;
    try {
        cuerpo = await respuesta.json();
    } catch {
        throw new Error("El servidor respondió con un formato inesperado.");
    }

    if (!cuerpo.exito) {
        throw new Error(cuerpo.mensaje || "Ocurrió un error inesperado.");
    }

    return cuerpo.datos;
}

const DASHBOARD_POR_ROL = {
    administrador: "dashboard.html",
    vendedor: "dashboard-vendedor.html",
    repositor: "dashboard-repositor.html",
};


async function obtenerUsuarioActual() {
    try {
        const datos = await apiFetch("/me.php");
        return datos.usuario;
    } catch {
        return null;
    }
}


async function protegerPagina(rolesPermitidos) {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
        window.location.href = "index.html";
        return null;
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
        window.location.href = DASHBOARD_POR_ROL[usuario.rol] || "index.html";
        return null;
    }

    return usuario;
}

async function cerrarSesion() {
    try {
        await apiFetch("/logout.php", { method: "POST" });
    } catch {
    }
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("a.nav-link").forEach((link) => {
        if (link.textContent.trim() === "Cerrar Sesión") {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                cerrarSesion();
            });
        }
    });
});
