<?php

declare(strict_types=1);

use App\Data\PocketBaseException;
use App\Http\RespuestaHttp;
use App\Logica\ValidacionException;

/**
 * Autoloader propio (PSR-4 simplificado): App\Data\Foo -> src/Data/Foo.php
 */
spl_autoload_register(function (string $clase): void {
    $prefijo = 'App\\';
    if (!str_starts_with($clase, $prefijo)) {
        return;
    }
    $rutaRelativa = str_replace('\\', '/', substr($clase, strlen($prefijo)));
    $archivo = __DIR__ . '/' . $rutaRelativa . '.php';
    if (is_file($archivo)) {
        require $archivo;
    }
});

/**
 * CORS: el frontend vive en GitHub Pages (otro origen) y el backend
 * PHP en la VM. Sin estos headers el navegador bloquea la llamada.
 *
 * Importante: Access-Control-Allow-Origin debe ser el origen EXACTO
 * (esquema + host, sin la ruta /stockflow/), y no se puede usar "*"
 * junto con Allow-Credentials.
 */
$config = require __DIR__ . '/../config/config.php';
$origenPermitido = $config['frontend_origin'] ?? '';
$origenRecibido = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origenRecibido !== '' && $origenRecibido === $origenPermitido) {
    header("Access-Control-Allow-Origin: {$origenPermitido}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// El navegador manda un preflight OPTIONS antes del POST/PATCH/DELETE real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * La cookie de sesión de PHP viaja entre dos dominios distintos
 * (GitHub Pages y la VM), así que el navegador la trata como
 * "cross-site": necesita SameSite=None + Secure (o sea, HTTPS
 * obligatorio también en el backend PHP, no solo en Pages).
 */
session_set_cookie_params([
    'samesite' => 'None',
    'secure' => true,
    'httponly' => true,
    'path' => '/',
]);

session_start();

/**
 * Manejo global de excepciones no capturadas: nunca se le muestra al
 * usuario un mensaje técnico ni un stack trace. El detalle real se
 * guarda en el log del servidor.
 */
set_exception_handler(function (Throwable $excepcion): void {
    error_log('[EXCEPCION NO CAPTURADA] ' . $excepcion->getMessage() . ' | ' . $excepcion->getTraceAsString());

    if ($excepcion instanceof ValidacionException) {
        RespuestaHttp::error('Datos inválidos', 400);
    }

    if ($excepcion instanceof PocketBaseException) {
        // Los códigos 401/403/404 de PocketBase se traducen igual al cliente,
        // el resto se homogeneiza como error genérico de servidor.
        $codigo = in_array($excepcion->getCode(), [400, 401, 403, 404], true)
            ? $excepcion->getCode()
            : 500;
        RespuestaHttp::error('No se pudo completar la operación', $codigo);
    }

    RespuestaHttp::error('Ocurrió un error inesperado. Intentá nuevamente más tarde.', 500);
});

/**
 * Convierte warnings/notices de PHP en excepciones para que también
 * pasen por el manejo centralizado de arriba (nunca se imprimen crudos
 * en la respuesta).
 */
set_error_handler(function (int $nivel, string $mensaje, string $archivo, int $linea): bool {
    // Los avisos de "deprecated" no son errores reales (por ejemplo,
    // curl_close() en PHP 8+): se registran pero no cortan el request.
    if ($nivel === E_DEPRECATED || $nivel === E_USER_DEPRECATED || $nivel === E_STRICT) {
        error_log("[DEPRECATED] {$mensaje} en {$archivo}:{$linea}");
        return true;
    }
    throw new ErrorException($mensaje, 0, $nivel, $archivo, $linea);
});
