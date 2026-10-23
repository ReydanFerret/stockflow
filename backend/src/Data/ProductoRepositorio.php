<?php

namespace App\Data;

class ProductoRepositorio extends RepositorioBase
{
    protected string $coleccion = 'productos';

    /** @throws PocketBaseException */
    public function crearConArchivo(array $campos, array $archivos, ?string $token = null): array
    {
        return PocketBaseClient::obtenerInstancia()->crearConArchivo($this->coleccion, $campos, $archivos, $token);
    }

    /** @throws PocketBaseException */
    public function actualizarConArchivo(string $id, array $campos, array $archivos, ?string $token = null): array
    {
        return PocketBaseClient::obtenerInstancia()->actualizarConArchivo($this->coleccion, $id, $campos, $archivos, $token);
    }

    /** @throws PocketBaseException */
    public function obtenerArchivo(string $id, string $nombreArchivo, ?string $token = null): array
    {
        return PocketBaseClient::obtenerInstancia()->obtenerArchivo($this->coleccion, $id, $nombreArchivo, $token);
    }
}
