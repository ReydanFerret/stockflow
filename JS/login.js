const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(e) {

    e.preventDefault();

    const rol = document.getElementById("rolUsuario").value;

    if (rol === "") {
        alert("Seleccione un rol");
        return;
    }

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