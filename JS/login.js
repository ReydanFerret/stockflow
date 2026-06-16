const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const usuario = document.getElementById("nombreUsuario").value;
    const contraseña = document.getElementById("contraseñaUsuario").value;
    const rol = document.getElementById("rolUsuario").value;

    // Validar cédula
    if (usuario.length !== 8) {
        alert("La cédula debe tener exactamente 8 dígitos.");
        return;
    }

    // Validar que sean solo números
    if (isNaN(usuario)) {
        alert("La cédula solo puede contener números.");
        return;
    }

    // Validar contraseña
    if (contraseña.trim() === "") { // Esta linea elimina espacios para que no tome espacios vacios como contraseña valida
        alert("Debe ingresar una contraseña.");
        return;
    }

    // Validar rol
    if (rol === "") {
        alert("Seleccione un rol.");
        return;
    }

    // Redirección según rol
    if (rol === "admin") {
        window.location.href = "dashboard.html";
    }

    if (rol === "vendedor") {
        window.location.href = "dashboard-vendedor.html";
    }

    if (rol === "repositor") {
        window.location.href = "dashboard-repositor.html";
    }

});