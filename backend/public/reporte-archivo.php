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

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();
$authServicio->exigirRol(['administrador']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    RespuestaHttp::error('Método no permitido', 405);
    exit;
}

$token = $authServicio->tokenActual();
$id = $_GET['id'] ?? '';

if ($id === '') {
    RespuestaHttp::error('Falta el id del reporte (?id=...)', 400);
    exit;
}

$reporteServicio = new ReporteServicio(new ReporteRepositorio());

try {
    $archivo = $reporteServicio->obtenerArchivo($id, $token);
} catch (ValidacionException $e) {
    RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 404);
    exit;
} catch (PocketBaseException $e) {
    RespuestaHttp::error('No se pudo obtener el archivo', 502);
    exit;
}

// Igual que imagen.php: esta respuesta son bytes crudos, no el sobre
// JSON de RespuestaHttp, porque va pensada para un link de descarga.
header('Content-Type: ' . $archivo['tipo']);
header('Content-Disposition: attachment; filename="reporte.pdf"');
header('Cache-Control: private, max-age=0');
echo $archivo['contenido'];
