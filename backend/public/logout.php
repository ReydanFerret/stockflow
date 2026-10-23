<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->logout();

RespuestaHttp::ok(['mensaje' => 'Sesión cerrada correctamente']);
