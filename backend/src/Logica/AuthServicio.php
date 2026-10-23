<?php

namespace App\Logica;

use App\Data\PocketBaseClient;
use App\Data\PocketBaseException;
use App\Http\RespuestaHttp;

/**
 * AuthServicio
 * ------------
 * Reglas de negocio de autenticación y autorización.
 *
 * Nota sobre password_hash(): el hashing de contraseñas lo hace
 * PocketBase internamente (bcrypt) al crear/actualizar un registro
 * en la colección "usuarios" y al validar el login. Este servicio
 * NUNCA recibe ni guarda contraseñas en texto plano más allá del
 * único request de login/registro, y jamás las persiste localmente
 * (no hay archivo ni base propia con contraseñas).
 */
class AuthServicio
{
    private const COLECCION = 'usuarios';

    public function __construct(private PocketBaseClient $cliente)
    {
    }

    /**
     * Intenta loguear con cédula + contraseña.
     * Guarda token y datos del usuario en sesión si es exitoso.
     *
     * @throws ValidacionException
     * @throws PocketBaseException
     */
    public function login(string $cedula, string $password): array
    {
        $cedula = trim($cedula);

        if ($cedula === '' || $password === '') {
            throw new ValidacionException([
                'cedula' => 'La cédula es obligatoria',
                'password' => 'La contraseña es obligatoria',
            ]);
        }

        $respuesta = $this->cliente->autenticarConPassword(self::COLECCION, $cedula, $password);

        $_SESSION['token'] = $respuesta['token'];
        $_SESSION['usuario'] = $respuesta['record'];

        return $respuesta['record'];
    }

    public function logout(): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    public function usuarioActual(): ?array
    {
        return $_SESSION['usuario'] ?? null;
    }

    public function tokenActual(): ?string
    {
        return $_SESSION['token'] ?? null;
    }

    public function haySesionActiva(): bool
    {
        return isset($_SESSION['token'], $_SESSION['usuario']);
    }

    /**
     * Corta la ejecución con 401 si no hay sesión activa.
     * Usar al principio de cada script de public/ que requiera login.
     */
    public function exigirSesion(): void
    {
        if (!$this->haySesionActiva()) {
            RespuestaHttp::error('No autenticado. Iniciá sesión para continuar.', 401);
        }
    }

    /**
     * Corta la ejecución con 403 si el usuario logueado no tiene
     * alguno de los roles permitidos.
     *
     * @param string[] $rolesPermitidos
     */
    public function exigirRol(array $rolesPermitidos): void
    {
        $this->exigirSesion();

        $rolUsuario = $_SESSION['usuario']['rol'] ?? null;

        if (!in_array($rolUsuario, $rolesPermitidos, true)) {
            RespuestaHttp::error('No tenés permisos para realizar esta acción.', 403);
        }
    }
}
