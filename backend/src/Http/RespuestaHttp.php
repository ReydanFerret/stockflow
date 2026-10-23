<?php

namespace App\Http;

/**
 * Centraliza el formato de TODAS las respuestas del backend, para que
 * el frontend siempre reciba la misma forma de JSON y el código HTTP
 * correcto (200, 400, 401, 403, 404, 500...).
 */
class RespuestaHttp
{
    public static function ok(array $datos = [], int $codigo = 200): void
    {
        self::enviar($codigo, ['exito' => true, 'datos' => $datos]);
    }

    public static function error(string $mensaje, int $codigo = 400): void
    {
        self::enviar($codigo, ['exito' => false, 'mensaje' => $mensaje]);
    }

    private static function enviar(int $codigo, array $cuerpo): void
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
