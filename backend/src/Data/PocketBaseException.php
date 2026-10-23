<?php

namespace App\Data;

use Exception;

/**
 * Excepción específica de la capa de datos. Se distingue de otras
 * excepciones del sistema para poder capturarla puntualmente en la
 * capa de presentación y decidir qué código HTTP devolver.
 */
class PocketBaseException extends Exception
{
    /** @var array Datos crudos que devolvió PocketBase (para logging interno) */
    private array $datos;

    public function __construct(string $mensaje, int $codigoHttp, array $datos = [])
    {
        parent::__construct($mensaje, $codigoHttp);
        $this->datos = $datos;
    }

    public function obtenerDatos(): array
    {
        return $this->datos;
    }
}
