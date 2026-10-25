<?php

declare(strict_types=1);

/**
 * Endpoint: POST /login.php
 * Inicia sesión con cédula y contraseña (el login real lo valida PocketBase).
 * Body JSON : { "cedula": "...", "password": "..." }
 * Responde  : 200 { usuario: { id, nombre, apellido, rol } } | 400 faltan datos | 401 credenciales inválidas
 *             | 503 no hay conexión con la base de datos.
 * Efecto    : guarda token y usuario en la sesión de PHP.
 */

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\PocketBaseException;
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
} catch (PocketBaseException $e) {
    // PocketBase responde 400 (o 401/404) cuando la cédula no existe o la
    // contraseña no coincide.
    if (in_array($e->getCode(), [400, 401, 404], true)) {
        RespuestaHttp::error('Cédula o contraseña incorrectas. Revisá los datos e intentá de nuevo.', 401);
    }

    // Código 0: no se pudo conectar con PocketBase (caído, timeout, etc.)
    if ($e->getCode() === 0) {
        error_log('[LOGIN] Sin conexión con PocketBase: ' . $e->getMessage());
        RespuestaHttp::error('No se pudo conectar con el servidor. Intentá nuevamente en unos minutos.', 503);
    }

    // Cualquier otro caso lo resuelve el manejador global de bootstrap.php
    throw $e;
}