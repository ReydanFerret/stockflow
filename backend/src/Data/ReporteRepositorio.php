<?php

namespace App\Data;

/**
 * Repositorio de la colección "reportes" (cada registro guarda un PDF).
 * La subida y descarga del PDF usan crearConArchivo() y obtenerArchivo(),
 * heredados de RepositorioBase.
 */
class ReporteRepositorio extends RepositorioBase
{
    protected string $coleccion = 'reportes';
}
