<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\GastoRepositorio;
use App\Data\RegistroRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\GastoServicio;
use App\Logica\ValidacionException;

$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();

$token = $authServicio->tokenActual();
$usuario = $authServicio->usuarioActual();
$gastoServicio = new GastoServicio(new GastoRepositorio(), new RegistroRepositorio());

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Ver el historial de gastos queda para admin (info sensible del negocio)
        $authServicio->exigirRol(['administrador']);

        $desde = $_GET['desde'] ?? null;
        $hasta = $_GET['hasta'] ?? null;

        try {
            $gastos = $gastoServicio->listar($token, $desde, $hasta);
            RespuestaHttp::ok(['gastos' => $gastos]);
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }
        break;

    case 'POST':
        $authServicio->exigirRol(['administrador']);

        $entrada = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        try {
            $gasto = $gastoServicio->crear($entrada, $usuario['id'], $token);
            RespuestaHttp::ok(['gasto' => $gasto], 201);
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }
        break;

    default:
        RespuestaHttp::error('Método no permitido', 405);
}
