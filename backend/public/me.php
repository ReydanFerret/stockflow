<?php

declare(strict_types=1);

/**
 * Endpoint: GET /me.php
 * Devuelve el usuario de la sesión activa. El frontend lo usa para
 * saber si hay sesión y a qué panel mandar al usuario según su rol.
 * Responde: 200 { usuario: { id, nombre, apellido, rol } } | 401 sin sesión.
 */

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();

$usuario = $authServicio->usuarioActual();

RespuestaHttp::ok([
    'usuario' => [
        'id' => $usuario['id'],
        'nombre' => $usuario['nombre'],
        'apellido' => $usuario['apellido'],
        'rol' => $usuario['rol'],
    ],
]);
