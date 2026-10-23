<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\UsuarioRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\UsuarioServicio;
use App\Logica\ValidacionException;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();
// Toda la gestión de personal es exclusiva del rol administrador
$authServicio->exigirRol(['administrador']);

$token = $authServicio->tokenActual();
$usuarioServicio = new UsuarioServicio(new UsuarioRepositorio());

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $usuarios = $usuarioServicio->listar($token);
        RespuestaHttp::ok(['usuarios' => $usuarios]);
        break;

    case 'POST':
        $entrada = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        try {
            $usuario = $usuarioServicio->crear($entrada, $token);
            RespuestaHttp::ok([
                'usuario' => [
                    'id' => $usuario['id'],
                    'nombre' => $usuario['nombre'],
                    'apellido' => $usuario['apellido'],
                    'cedula' => $usuario['cedula'],
                    'rol' => $usuario['rol'],
                ],
            ], 201);
        } catch (ValidacionException $e) {
            RespuestaHttp::error('Datos inválidos. Revisá cédula, contraseña (mínimo 8 caracteres) y rol.', 400);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? '';
        if ($id === '') {
            RespuestaHttp::error('Falta el id del usuario (?id=...)', 400);
        }

        $usuarioServicio->eliminar($id, $token);
        RespuestaHttp::ok(['mensaje' => 'Usuario eliminado']);
        break;

    default:
        RespuestaHttp::error('Método no permitido', 405);
}
