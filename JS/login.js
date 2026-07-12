//Declara una constante con el form de id loginForm
const loginForm = document.getElementById("loginForm");

//Esta función toma los div con id "mensajeError" y le agrega ciertas clases de bootstrap y el rol
//de alert, además agrega un boton para cerrar la alerta
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

//Funcion que se ejecuta al subir el formulario
loginForm.addEventListener("submit", function(e) {

    //Evita el comportamiento normal de los componentes del form además de evitar que recargue la web
    e.preventDefault();

    //Se declaran distintas constantes con los input del form y extrae el valor de los mismos
    const usuario = document.getElementById("nombreUsuario").value;
    const contraseña = document.getElementById("contraseñaUsuario").value;
    const rol = document.getElementById("rolUsuario").value;

    //Validar que la cedula tenga exactamente 8 caracteres y si no los tiene muestra un error
    if (usuario.length !== 8) {
        mostrarError("La cédula debe tener exactamente 8 dígitos.");
        return;
    }

    //Validar que el contenido ingresado sean solo números y si no lo es muestra un error
    if (isNaN(usuario)) {
        mostrarError("La cédula solo puede contener números.");
        return;
    }

    if (contraseña.trim() === "") { //Esta linea elimina espacios para que no tome espacios vacios como contraseña valida
        mostrarError("Debe ingresar una contraseña."); //Muestra un error por dejar vacia la contraseña
        return;
    }

    //Valida que el usuario haya seleccionado un rol y si no lo selecciona muestra un error
    if (rol === "") {
        mostrarError("Seleccione un rol.");
        return;
    }

    //Redirecciona al usuario a la pantalla de admin si su rol es admin y vacia los campos
    if (rol === "admin") {
        window.location.href = "dashboard.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }
    //Redirecciona al usuario a la pantalla de vendedor si el rol es vendedor y vacia los campos
    if (rol === "vendedor") {
        window.location.href = "dashboard-vendedor.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }
    // Redirecciona al usuario a la pantalla de repositor si el rol es repositor y vacia los campos
    if (rol === "repositor") {
        window.location.href = "dashboard-repositor.html";
        document.getElementById("nombreUsuario").value = "";
        document.getElementById("contraseñaUsuario").value = "";
    }

});