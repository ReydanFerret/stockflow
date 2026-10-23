<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\PocketBaseException;
use App\Data\ReporteRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\ReporteServicio;
use App\Logica\ValidacionException;

// Solo el administrador genera y ve el historial de reportes.
$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();
$authServicio->exigirRol(['administrador']);

$token = $authServicio->tokenActual();
$reporteServicio = new ReporteServicio(new ReporteRepositorio());

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $reportes = $reporteServicio->listar($token);
            RespuestaHttp::ok(['reportes' => $reportes]);
        } catch (PocketBaseException $e) {
                }
        break;

    case 'POST':
        $entrada = $_POST;
        $archivo = $_FILES['archivo'] ?? null;

        try {
            $reporte = $reporteServicio->registrar($entrada, $archivo, $token);
            RespuestaHttp::ok(['reporte' => $reporte], 201);
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }
        break;

    default:
        RespuestaHttp::error('Método no permitido', 405);
}
