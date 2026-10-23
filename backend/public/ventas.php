<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\VentaRepositorio;
use App\Data\VentaRealizadaRepositorio;
use App\Data\ProductoRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\VentaServicio;
use App\Logica\ValidacionException;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();

$token = $authServicio->tokenActual();
$usuario = $authServicio->usuarioActual();
$ventaServicio = new VentaServicio(
    new VentaRepositorio(),
    new VentaRealizadaRepositorio(),
    new ProductoRepositorio()
);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $desde = $_GET['desde'] ?? null;
        $hasta = $_GET['hasta'] ?? null;

        try {
            $ventas = $ventaServicio->listar($token, $desde, $hasta);
            RespuestaHttp::ok(['ventas' => $ventas]);
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }
        break;

    case 'POST':
        // Solo vendedor o administrador registran ventas
        $authServicio->exigirRol(['vendedor', 'administrador']);

        $entrada = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        try {
            $venta = $ventaServicio->crear($entrada, $usuario['id'], $token);
            RespuestaHttp::ok(['venta' => $venta], 201);
        } catch (ValidacionException $e) {
            // Unimos los mensajes por campo en un solo string legible,
            // en vez del genérico "Datos inválidos". Ej: "Stock
            // insuficiente. Disponible: 3"
            $mensaje = implode(' ', $e->obtenerErrores());
            RespuestaHttp::error($mensaje, 400);
        }
        break;

    default:
        RespuestaHttp::error('Método no permitido', 405);
}
