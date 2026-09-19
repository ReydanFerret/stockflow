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
loginForm.addEventListener("submit", async function (e) {

    //Evita el comportamiento normal de los componentes del form además de evitar que recargue la web
    e.preventDefault();

    //Se declaran distintas constantes con los input del form y extrae el valor de los mismos
    const usuario = document.getElementById("nombreUsuario").value.trim();
    const contraseña = document.getElementById("contraseñaUsuario").value;

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

    // Ya no se pide el rol: lo devuelve el propio backend según el
    // usuario que inició sesión (viene de la colección "usuarios" en
    // PocketBase), así que no hay forma de "elegir" un rol que no sea
    // el que en verdad tiene esa cédula.
    try {
        const datos = await apiFetch("/login.php", {
            method: "POST",
            body: { cedula: usuario, password: contraseña },
        });

        const rol = datos.usuario.rol;
        const destino = DASHBOARD_POR_ROL[rol];

        if (!destino) {
            mostrarError("Tu usuario no tiene un rol válido asignado. Contactá al administrador.");
            return;
        }

        window.location.href = destino;
    } catch (error) {
        // apiFetch ya nos da el mensaje real que mandó el backend
        // (por ejemplo "Cédula y contraseña son obligatorias")
        mostrarError(error.message);
    }
});
