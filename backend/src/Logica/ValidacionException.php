<?php

namespace App\Logica;

use Exception;

/**
 * Se lanza cuando los datos que mandó el usuario no pasan las
 * validaciones del servidor (independiente de si el cliente ya
 * validó o no en el formulario).
 */
class ValidacionException extends Exception
{
    /** @var array<string,string> lista de errores por campo */
    private array $errores;

    public function __construct(array $errores)
    {
        parent::__construct('Los datos enviados no son válidos');
        $this->errores = $errores;
    }

    /** Devuelve los errores como un array campo => mensaje. */
    public function obtenerErrores(): array
    {
        return $this->errores;
    }

    /**
     * Une todos los mensajes en un solo texto legible para mostrarle
     * al usuario. Ej.: "Stock insuficiente. Disponible: 3"
     */
    public function obtenerMensaje(): string
    {
        return implode(' ', $this->errores);
    }
}
