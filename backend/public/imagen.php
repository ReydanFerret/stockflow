<?php

declare(strict_types=1);

/**
 * Endpoint: GET /imagen.php?id=<idProducto>  (requiere sesión)
 * Proxy de imágenes: descarga la imagen del producto desde PocketBase y la
 * devuelve como bytes, para que el navegador nunca conozca la URL de PocketBase.
 * Responde: la imagen | 400 falta id | 404 producto sin imagen | 502 fallo al obtenerla.
 */

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\PocketBaseException;
use App\Data\ProductoRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\ProductoServicio;
use App\Logica\ValidacionException;

// Igual que el resto de la API: sin sesión activa no se puede acceder,
// ni siquiera a las imágenes.
$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    RespuestaHttp::error('Método no permitido', 405);
    exit;
}

$token = $authServicio->tokenActual();
$id = $_GET['id'] ?? '';

if ($id === '') {
    RespuestaHttp::error('Falta el id del producto (?id=...)', 400);
    exit;
}

$productoServicio = new ProductoServicio(new ProductoRepositorio());

try {
    $archivo = $productoServicio->obtenerImagen($id, $token);
} catch (ValidacionException $e) {
    RespuestaHttp::error($e->obtenerMensaje(), 404);
    exit;
} catch (PocketBaseException $e) {
    RespuestaHttp::error('No se pudo obtener la imagen', 502);
    exit;
}

// Esta respuesta es distinta al resto de la API (no es el sobre JSON
// de RespuestaHttp) porque acá el contenido son los bytes crudos de
// la imagen, pensados para usarse directo en un <img src="...">.
header('Content-Type: ' . $archivo['tipo']);
header('Cache-Control: private, max-age=300');
echo $archivo['contenido'];
