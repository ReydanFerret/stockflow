<?php

declare(strict_types=1);

require __DIR__ . '/../src/bootstrap.php';

use App\Data\PocketBaseClient;
use App\Data\ProductoRepositorio;
use App\Http\RespuestaHttp;
use App\Logica\AuthServicio;
use App\Logica\ProductoServicio;
use App\Logica\ValidacionException;

// --- Ruta protegida: sin sesión activa no se puede acceder ---
$authServicio = new AuthServicio(PocketBaseClient::obtenerInstancia());
$authServicio->exigirSesion();

$token = $authServicio->tokenActual();
$productoServicio = new ProductoServicio(new ProductoRepositorio());

// Content-Type puede venir como "multipart/form-data; boundary=----xyz"
$esMultipart = str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Cualquier usuario logueado puede ver productos
        $productos = $productoServicio->listar($token);
        RespuestaHttp::ok(['productos' => $productos]);
        break;

    case 'POST':
        // Solo repositor o administrador pueden cargar/editar productos
        $authServicio->exigirRol(['repositor', 'administrador']);

        if ($esMultipart) {
            $entrada = $_POST;
            $archivo = $_FILES['imagen'] ?? null;
            if ($archivo !== null && ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                $archivo = null; // el input estaba presente pero vacío
            }
        } else {
            $entrada = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $archivo = null;
        }

        // Method override: PHP no puebla $_FILES en requests PATCH, así
        // que una edición CON imagen nueva se manda como POST multipart
        // con _metodo=PATCH + id. Una edición sin imagen sigue usando
        // PATCH + JSON normalmente (ver el case 'PATCH' de abajo).
        $esEdicionConImagen = $esMultipart && ($entrada['_metodo'] ?? '') === 'PATCH';

        try {
            if ($esEdicionConImagen) {
                $id = $entrada['id'] ?? '';
                if ($id === '') {
                    RespuestaHttp::error('Falta el id del producto', 400);
                    break;
                }
                $producto = $productoServicio->actualizar($id, $entrada, $token, $archivo);
                RespuestaHttp::ok(['producto' => $producto]);
            } else {
                $producto = $productoServicio->crear($entrada, $token, $archivo);
                RespuestaHttp::ok(['producto' => $producto], 201);
            }
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }
        break;

    case 'PATCH':
        // Solo repositor o administrador pueden editar productos.
        // Este caso es solo para ediciones SIN imagen nueva (JSON).
        $authServicio->exigirRol(['repositor', 'administrador']);

        $id = $_GET['id'] ?? '';

        if ($id === '') {
            RespuestaHttp::error('Falta el id del producto (?id=...)', 400);
            break;
        }

        $entrada = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            // El repositor solo edita stock (manda { stock: X } y nada
            // más). El admin edita el producto completo. Si viene
            // ÚNICAMENTE el campo stock, usamos actualizarStock(), que
            // no exige nombre/precio/etc — si no, la validación general
            // de actualizar() rechazaba el PATCH del repositor porque
            // le faltaban esos campos.
            if (array_key_exists('stock', $entrada) && count($entrada) === 1) {
                $producto = $productoServicio->actualizarStock($id, $entrada['stock'], $token);
            } else {
                $producto = $productoServicio->actualizar($id, $entrada, $token);
            }
            RespuestaHttp::ok(['producto' => $producto]);
        } catch (ValidacionException $e) {
            RespuestaHttp::error(implode(' ', $e->obtenerErrores()), 400);
        }

        break;

    case 'DELETE':
        $authServicio->exigirRol(['administrador']);

        $id = $_GET['id'] ?? '';
        if ($id === '') {
            RespuestaHttp::error('Falta el id del producto (?id=...)', 400);
            break;
        }

        $productoServicio->eliminar($id, $token);
        RespuestaHttp::ok(['mensaje' => 'Producto eliminado']);
        break;

    default:
        RespuestaHttp::error('Método no permitido', 405);
}
