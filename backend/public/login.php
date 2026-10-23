<?php

declare(strict_types=1);

/**
 * Endpoint: POST /login.php
 * Inicia sesión con cédula y contraseña (el login real lo valida PocketBase).
 * Body JSON : { "cedula": "...", "password": "..." }
 * Responde  : 200 { usuario: { id, nombre, apellido, rol } } | 400 faltan datos | 401 credenciales inválidas.
 * Efecto    : guarda token y usuario en la sesión de PHP.
 */

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\ValidacionException;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    RespuestaHttp::error('Método no permitido', 405);
}

$entrada = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());

try {
    $usuario = $authServicio->login(
        $entrada['cedula'] ?? '',
        $entrada['password'] ?? ''
    );

    // Nunca devolver contraseñas ni tokens internos de PocketBase que no hagan falta
    RespuestaHttp::ok([
        'usuario' => [
            'id' => $usuario['id'],
            'nombre' => $usuario['nombre'],
            'apellido' => $usuario['apellido'],
            'rol' => $usuario['rol'],
        ],
    ]);
} catch (ValidacionException $e) {
    RespuestaHttp::error('Cédula y contraseña son obligatorias', 400);
}
// Cualquier otra excepción (credenciales inválidas, error de conexión, etc.)
// la resuelve el manejador global definido en bootstrap.php
