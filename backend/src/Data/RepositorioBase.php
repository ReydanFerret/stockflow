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
 * extiende esta clase y define $coleccion.
 */
abstract class RepositorioBase
{
    protected string $coleccion;
    private PocketBaseClient $cliente;

    public function __construct()
    {
        $this->cliente = PocketBaseClient::obtenerInstancia();
    }

    public function listar(?string $token = null, array $filtros = []): array
    {
        $respuesta = $this->cliente->listar($this->coleccion, $token, $filtros);
        return $respuesta['items'] ?? [];
    }

    public function obtenerPorId(string $id, ?string $token = null): array
    {
        return $this->cliente->obtener($this->coleccion, $id, $token);
    }

    public function crear(array $datos, ?string $token = null): array
    {
        return $this->cliente->crear($this->coleccion, $datos, $token);
    }

    public function actualizar(string $id, array $datos, ?string $token = null): array
    {
        return $this->cliente->actualizar($this->coleccion, $id, $datos, $token);
    }

    public function eliminar(string $id, ?string $token = null): bool
    {
        return $this->cliente->eliminar($this->coleccion, $id, $token);
    }
}
