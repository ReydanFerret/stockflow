<?php

namespace App\Logica;

use App\Data\UsuarioRepositorio;

/**
 * Gestión de personal: crear y listar usuarios del sistema.
 * Solo se llama desde public/usuarios.php, que ya exige rol
 * "administrador" antes de invocar estos métodos.
 */
class UsuarioServicio
{
    public function __construct(private UsuarioRepositorio $repositorio)
    {
    }

    public function listar(string $token): array
    {
        $usuarios = $this->repositorio->listar($token, ['sort' => 'nombre']);

        // Nunca devolver contraseñas ni datos internos de PocketBase al frontend
        return array_map(fn(array $u) => [
            'id' => $u['id'],
            'nombre' => $u['nombre'] ?? '',
            'apellido' => $u['apellido'] ?? '',
            'cedula' => $u['cedula'] ?? '',
            'email' => $u['email'] ?? '',
            'telefono' => $u['telefono'] ?? '',
            'rol' => $u['rol'] ?? '',
            'estado' => $u['estado'] ?? false,
        ], $usuarios);
    }

    /**
     * @throws ValidacionException
     */
    public function crear(array $entrada, string $token): array
    {
        $errores = [];

        $cedula = trim($entrada['cedula'] ?? '');
        if (!preg_match('/^\d{6,8}$/', $cedula)) {
            $errores['cedula'] = 'La cédula debe tener entre 6 y 8 dígitos numéricos';
        }

        $nombre = trim(strip_tags($entrada['nombre'] ?? ''));
        if ($nombre === '') {
            $errores['nombre'] = 'El nombre es obligatorio';
        }

        $apellido = trim(strip_tags($entrada['apellido'] ?? ''));
        if ($apellido === '') {
            $errores['apellido'] = 'El apellido es obligatorio';
        }

        $password = $entrada['password'] ?? '';
        if (strlen($password) < 8) {
            $errores['password'] = 'La contraseña debe tener al menos 8 caracteres';
        }

        $rolesValidos = ['vendedor', 'administrador', 'repositor'];
        $rol = strtolower(trim($entrada['rol'] ?? ''));
        if (!in_array($rol, $rolesValidos, true)) {
            $errores['rol'] = 'Rol inválido';
        }

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }

        $email = trim($entrada['email'] ?? '');
        $telefono = trim(strip_tags($entrada['telefono'] ?? ''));
        $estado = ($entrada['estado'] ?? 'Activo') !== 'Inactivo';

        // PocketBase, al crear un registro en una colección "auth",
        // exige password + passwordConfirm. El hash real (bcrypt) lo
        // hace PocketBase internamente, no este código.
        $datosPocketBase = [
            'cedula' => $cedula,
            'nombre' => $nombre,
            'apellido' => $apellido,
            'telefono' => $telefono,
            'estado' => $estado,
            'rol' => $rol,
            'password' => $password,
            'passwordConfirm' => $password,
	     'emailVisibility' => true,
        ];

        if ($email !== '') {
            $datosPocketBase['email'] = $email;
        }

        return $this->repositorio->crear($datosPocketBase, $token);
    }

    public function eliminar(string $id, string $token): bool
    {
        return $this->repositorio->eliminar($id, $token);
    }
}
