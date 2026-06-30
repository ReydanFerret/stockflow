const loginForm = document.getElementById("loginForm");

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

loginForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const usuario = document.getElementById("nombreUsuario").value;
    const contraseña = document.getElementById("contraseñaUsuario").value;
    const rol = document.getElementById("rolUsuario").value;

    // Validar cédula
    if (usuario.length !== 8) {
        mostrarError("La cédula debe tener exactamente 8 dígitos.");
        return;
    }

    // Validar que sean solo números
    if (isNaN(usuario)) {
        mostrarError("La cédula solo puede contener números.");
        return;
    }

    // Validar contraseña
    if (contraseña.trim() === "") { // Esta linea elimina espacios para que no tome espacios vacios como contraseña valida
        mostrarError("Debe ingresar una contraseña.");
        return;
    }

    // Validar rol
    if (rol === "") {
        mostrarError("Seleccione un rol.");
        return;
    }

    // Redirección según rol
    if (rol === "admin") {
        window.location.href = "dashboard.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }

    if (rol === "vendedor") {
        window.location.href = "dashboard-vendedor.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }

    if (rol === "repositor") {
        window.location.href = "dashboard-repositor.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }

});