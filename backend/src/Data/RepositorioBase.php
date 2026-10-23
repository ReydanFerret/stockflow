<?php

namespace App\Data;

/**
 * RepositorioBase
 * ----------------
 * Patrón de diseño: REPOSITORY.
 * Justificación: la capa de lógica no debería saber que "por debajo"
 * hay una API REST de PocketBase; solo pide "dame los productos",
 * "creá este producto", etc. Si el día de mañana cambia el motor de
 * persistencia (por ejemplo, se migra a PDO+MariaDB), solo hay que
 * reescribir los repositorios — la capa de lógica y la de
 * presentación no se tocan.
 *
 * Cada colección de PocketBase tiene su propio repositorio que
 * extiende esta clase y solo define $coleccion. Todo el comportamiento
 * común (CRUD, subida y descarga de archivos) vive acá, para no
 * repetirlo en cada repositorio hijo.
 */
abstract class RepositorioBase
{
    /** Nombre de la colección de PocketBase (lo define cada hijo). */
    protected string $coleccion;

    private PocketBaseClient $cliente;

    public function __construct()
    {
        $this->cliente = PocketBaseClient::obtenerInstancia();
    }

    /**
     * Lista los registros de la colección.
     *
     * @param string|null $token   Token del usuario logueado (respeta las reglas de acceso de PocketBase).
     * @param array       $filtros Parámetros de consulta de PocketBase: 'filter', 'sort', 'expand'.
     * @return array Lista de registros (vacía si no hay ninguno).
     * @throws PocketBaseException
     */
    public function listar(?string $token = null, array $filtros = []): array
    {
        $respuesta = $this->cliente->listar($this->coleccion, $token, $filtros);
        return $respuesta['items'] ?? [];
    }

    /**
     * Devuelve un registro por su id.
     *
     * @throws PocketBaseException si no existe (404) o no hay permiso.
     */
    public function obtenerPorId(string $id, ?string $token = null): array
    {
        return $this->cliente->obtener($this->coleccion, $id, $token);
    }

    /**
     * Crea un registro y devuelve el registro creado (con su id).
     *
     * @throws PocketBaseException
     */
    public function crear(array $datos, ?string $token = null): array
    {
        return $this->cliente->crear($this->coleccion, $datos, $token);
    }

    /**
     * Actualiza solo los campos indicados (PATCH) y devuelve el registro.
     *
     * @throws PocketBaseException
     */
    public function actualizar(string $id, array $datos, ?string $token = null): array
    {
        return $this->cliente->actualizar($this->coleccion, $id, $datos, $token);
    }

    /**
     * Elimina un registro por su id.
     *
     * @throws PocketBaseException
     */
    public function eliminar(string $id, ?string $token = null): bool
    {
        return $this->cliente->eliminar($this->coleccion, $id, $token);
    }

    /**
     * Crea un registro que incluye archivos (multipart/form-data).
     * Solo lo usan las colecciones que guardan archivos
     * (productos -> imagen, reportes -> archivo).
     *
     * @param array $campos   Campos normales del registro.
     * @param array $archivos Mapa campo => entrada de $_FILES.
     * @throws PocketBaseException
     */
    public function crearConArchivo(array $campos, array $archivos, ?string $token = null): array
    {
        return $this->cliente->crearConArchivo($this->coleccion, $campos, $archivos, $token);
    }

    /**
     * Igual que crearConArchivo(), pero sobre un registro existente.
     *
     * @throws PocketBaseException
     */
    public function actualizarConArchivo(string $id, array $campos, array $archivos, ?string $token = null): array
    {
        return $this->cliente->actualizarConArchivo($this->coleccion, $id, $campos, $archivos, $token);
    }

    /**
     * Descarga los bytes de un archivo guardado en un registro, para
     * servirlo desde el backend sin exponer la URL de PocketBase.
     *
     * @return array{contenido: string, tipo: string}
     * @throws PocketBaseException
     */
    public function obtenerArchivo(string $id, string $nombreArchivo, ?string $token = null): array
    {
        return $this->cliente->obtenerArchivo($this->coleccion, $id, $nombreArchivo, $token);
    }
}
