<?php

namespace App\Data;

/**
 * Repositorio de la colección "productos".
 * Las imágenes se manejan con crearConArchivo(), actualizarConArchivo()
 * y obtenerArchivo(), heredados de RepositorioBase.
 */
class ProductoRepositorio extends RepositorioBase
{
    protected string $coleccion = 'productos';
}
