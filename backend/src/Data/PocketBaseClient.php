<?php

namespace App\Data;

/**
 * PocketBaseClient
 * -----------------
 * Capa de datos: es el ÚNICO lugar del sistema que sabe cómo hablar
 * HTTP con PocketBase. Ninguna otra clase arma URLs ni llama curl
 * directamente.
 *
 * Patrón de diseño: SINGLETON.
 * Justificación: la app abre muchas peticiones por request (listar,
 * crear, autenticar), y todas deben compartir la misma configuración
 * (URL base, timeouts). Un Singleton evita instanciar el cliente y
 * releer config.php una y otra vez, y centraliza en un solo punto
 * cualquier cambio futuro (por ejemplo, agregar reintentos o logging
 * de todas las llamadas salientes).
 */
class PocketBaseClient
{
    private static ?PocketBaseClient $instancia = null;

    private string $baseUrl;

    private function __construct(string $baseUrl)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    public static function obtenerInstancia(): self
    {
        if (self::$instancia === null) {
            $config = require __DIR__ . '/../../config/config.php';
            self::$instancia = new self($config['pocketbase_url']);
        }

        return self::$instancia;
    }

    /**
     * Autentica un registro contra una colección "auth" de PocketBase
     * (en nuestro caso: "usuarios", usando cedula como identidad).
     *
     * @throws PocketBaseException
     */
    public function autenticarConPassword(string $coleccion, string $identidad, string $password): array
    {
        return $this->peticion(
            'POST',
            "/api/collections/{$coleccion}/auth-with-password",
            ['identity' => $identidad, 'password' => $password]
        );
    }

    /** @throws PocketBaseException */
    public function listar(string $coleccion, ?string $token = null, array $query = []): array
    {
        $queryString = empty($query) ? '' : ('?' . http_build_query($query));
        return $this->peticion('GET', "/api/collections/{$coleccion}/records{$queryString}", null, $token);
    }

    /** @throws PocketBaseException */
    public function obtener(string $coleccion, string $id, ?string $token = null): array
    {
        return $this->peticion('GET', "/api/collections/{$coleccion}/records/{$id}", null, $token);
    }

    /** @throws PocketBaseException */
    public function crear(string $coleccion, array $datos, ?string $token = null): array
    {
        return $this->peticion('POST', "/api/collections/{$coleccion}/records", $datos, $token);
    }

    /** @throws PocketBaseException */
    public function actualizar(string $coleccion, string $id, array $datos, ?string $token = null): array
    {
        return $this->peticion('PATCH', "/api/collections/{$coleccion}/records/{$id}", $datos, $token);
    }

    /** @throws PocketBaseException */
    public function eliminar(string $coleccion, string $id, ?string $token = null): bool
    {
        $this->peticion('DELETE', "/api/collections/{$coleccion}/records/{$id}", null, $token);
        return true;
    }

    /**
     * Crea un registro incluyendo uno o más archivos (multipart).
     *
     * @param array $campos   Campos normales del registro (nombre, precio, etc.)
     * @param array $archivos Mapa campo => entrada de $_FILES (tmp_name, name, type)
     * @throws PocketBaseException
     */
    public function crearConArchivo(string $coleccion, array $campos, array $archivos, ?string $token = null): array
    {
        return $this->peticionMultipart('POST', "/api/collections/{$coleccion}/records", $campos, $archivos, $token);
    }

    /**
     * Actualiza un registro incluyendo uno o más archivos (multipart).
     *
     * @throws PocketBaseException
     */
    public function actualizarConArchivo(string $coleccion, string $id, array $campos, array $archivos, ?string $token = null): array
    {
        return $this->peticionMultipart('PATCH', "/api/collections/{$coleccion}/records/{$id}", $campos, $archivos, $token);
    }

    /**
     * Descarga el contenido crudo de un archivo almacenado en PocketBase.
     * Usado por endpoints "proxy" (ej. imagen.php) para que el navegador
     * nunca necesite conocer la URL real de PocketBase.
     *
     * @return array{contenido: string, tipo: string}
     * @throws PocketBaseException
     */
    public function obtenerArchivo(string $coleccion, string $recordId, string $nombreArchivo, ?string $token = null): array
    {
        $url = "{$this->baseUrl}/api/files/{$coleccion}/{$recordId}/{$nombreArchivo}";
        if ($token !== null) {
            $url .= '?' . http_build_query(['token' => $token]);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $contenido = curl_exec($ch);
        $codigoHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $tipoContenido = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $errorCurl = curl_error($ch);
        curl_close($ch);

        if ($contenido === false) {
            throw new PocketBaseException("Error de conexión con PocketBase: {$errorCurl}", 0);
        }

        if ($codigoHttp < 200 || $codigoHttp >= 300) {
            throw new PocketBaseException('No se pudo obtener el archivo', $codigoHttp);
        }

        return [
            'contenido' => $contenido,
            'tipo' => $tipoContenido ?: 'application/octet-stream',
        ];
    }

    /**
     * Ejecuta la petición HTTP real contra PocketBase (JSON).
     *
     * @throws PocketBaseException si la respuesta no es 2xx o si falla la conexión
     */
    private function peticion(string $metodo, string $ruta, ?array $body = null, ?string $token = null): array
    {
        $url = $this->baseUrl . $ruta;
        $ch = curl_init($url);

        $headers = ['Content-Type: application/json'];
        if ($token !== null) {
            $headers[] = "Authorization: {$token}";
        }

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        return $this->ejecutarYDecodificar($ch);
    }

    /**
     * Ejecuta la petición HTTP real contra PocketBase (multipart/form-data),
     * usada cuando hay archivos de por medio. No se puede mandar
     * Content-Type manual acá: curl arma el boundary correcto solo
     * si CURLOPT_POSTFIELDS es un array (no un string ya serializado).
     *
     * @throws PocketBaseException
     */
    private function peticionMultipart(string $metodo, string $ruta, array $campos, array $archivos, ?string $token = null): array
    {
        $url = $this->baseUrl . $ruta;
        $ch = curl_init($url);

        $headers = [];
        if ($token !== null) {
            $headers[] = "Authorization: {$token}";
        }

        $cuerpoMultipart = $campos;
        foreach ($archivos as $nombreCampo => $archivo) {
            $cuerpoMultipart[$nombreCampo] = new \CURLFile(
                $archivo['tmp_name'],
                $archivo['type'] ?: 'application/octet-stream',
                $archivo['name']
            );
        }

        // PocketBase acepta PATCH multipart; curl con CUSTOMREQUEST +
        // POSTFIELDS array funciona igual sin importar el verbo.
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $metodo);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $cuerpoMultipart);

        return $this->ejecutarYDecodificar($ch);
    }

    /**
     * @throws PocketBaseException
     */
    private function ejecutarYDecodificar(\CurlHandle $ch): array
    {
        $respuestaCruda = curl_exec($ch);
        $codigoHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errorCurl = curl_error($ch);
        curl_close($ch);

        if ($respuestaCruda === false) {
            throw new PocketBaseException("Error de conexión con PocketBase: {$errorCurl}", 0);
        }

        $datos = json_decode($respuestaCruda, true) ?? [];

        if ($codigoHttp < 200 || $codigoHttp >= 300) {
            $mensaje = $datos['message'] ?? 'Error desconocido en PocketBase';
            throw new PocketBaseException($mensaje, $codigoHttp, $datos);
        }

        return $datos;
    }
}
