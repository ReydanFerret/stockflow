<?php

declare(strict_types=1);

/**
 * Endpoint: POST /logout.php
 * Cierra la sesión del usuario (destruye la sesión de PHP).
 * Responde: 200 { mensaje }.
 */

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->logout();

RespuestaHttp::ok(['mensaje' => 'Sesión cerrada correctamente']);
