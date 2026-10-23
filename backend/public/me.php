<?php

declare(strict_types=1);

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
