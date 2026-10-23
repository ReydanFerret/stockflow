<?php

namespace App\Data;

class ReporteRepositorio extends RepositorioBase
{
    protected string $coleccion = 'reportes';

    /** @throws PocketBaseException */
    public function crearConArchivo(array $campos, array $archivos, ?string $token = null): array
    {
        return PocketBaseClient::obtenerInstancia()->crearConArchivo($this->coleccion, $campos, $archivos, $token);
    }

    /** @throws PocketBaseException */
    public function obtenerArchivo(string $id, string $nombreArchivo, ?string $token = null): array
    {
        return PocketBaseClient::obtenerInstancia()->obtenerArchivo($this->coleccion, $id, $nombreArchivo, $token);
    }
}
