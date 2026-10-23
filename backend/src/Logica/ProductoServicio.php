<?php

namespace App\Logica;

use App\Data\ProductoRepositorio;

/**
 * Capa de lógica para productos: acá viven las reglas de negocio
 * (validación, sanitización, cálculos) — nunca SQL, nunca HTTP directo.
 */
class ProductoServicio
{
    private const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    private const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024; // 5 MB

    public function __construct(private ProductoRepositorio $repositorio)
    {
    }

    /** Lista todos los productos ordenados por nombre. */
    public function listar(string $token): array
    {
        return $this->repositorio->listar($token, ['sort' => 'nombre']);
    }

    /**
     * Crea un producto, con imagen opcional.
     *
     * @param array      $entrada Datos del formulario (nombre, precio, stock, umbral_minimo, descripcion).
     * @param array|null $archivo Entrada de $_FILES['imagen'], o null si no se subió imagen.
     * @throws ValidacionException si los datos o la imagen son inválidos.
     */
    public function crear(array $entrada, string $token, ?array $archivo = null): array
    {
        $datos = $this->validarYSanitizar($entrada);

        if ($archivo !== null) {
            $this->validarImagen($archivo);
            return $this->repositorio->crearConArchivo($datos, ['imagen' => $archivo], $token);
        }

        return $this->repositorio->crear($datos, $token);
    }

    /**
     * Actualiza un producto completo; la imagen solo cambia si se sube una nueva.
     *
     * @param array|null $archivo Entrada de $_FILES['imagen'], o null si no se subió imagen nueva.
     * @throws ValidacionException si los datos o la imagen son inválidos.
     */
    public function actualizar(string $id, array $entrada, string $token, ?array $archivo = null): array
    {
        $datos = $this->validarYSanitizar($entrada, esActualizacion: true);

        if ($archivo !== null) {
            $this->validarImagen($archivo);
            return $this->repositorio->actualizarConArchivo($id, $datos, ['imagen' => $archivo], $token);
        }

        return $this->repositorio->actualizar($id, $datos, $token);
    }

    /** Elimina un producto por su id. */
    public function eliminar(string $id, string $token): bool
    {
        return $this->repositorio->eliminar($id, $token);
    }

    /**
     * Actualización parcial: solo el stock (usado por el modo "Editar"
     * del repositor, que no toca el resto de los campos del producto).
     *
     * @throws ValidacionException
     */
    public function actualizarStock(string $id, mixed $stockEntrada, string $token): array
    {
        $stock = filter_var($stockEntrada, FILTER_VALIDATE_INT);
        if ($stock === false || $stock < 0) {
            throw new ValidacionException(['stock' => 'El stock debe ser un número entero mayor o igual a 0']);
        }

        return $this->repositorio->actualizar($id, ['stock' => $stock], $token);
    }

    /**
     * Devuelve el archivo de imagen de un producto para servirlo vía proxy.
     *
     * @return array{contenido: string, tipo: string}
     * @throws ValidacionException si el producto no tiene imagen cargada
     */
    public function obtenerImagen(string $id, string $token): array
    {
        $producto = $this->repositorio->obtenerPorId($id, $token);
        $nombreArchivo = $producto['imagen'] ?? '';

        if ($nombreArchivo === '') {
            throw new ValidacionException(['imagen' => 'El producto no tiene imagen cargada']);
        }

        return $this->repositorio->obtenerArchivo($id, $nombreArchivo, $token);
    }

    /**
     * @throws ValidacionException
     */
    private function validarImagen(array $archivo): void
    {
        $errores = [];

        if (($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $errores['imagen'] = 'Hubo un problema al subir la imagen';
        } elseif (!in_array($archivo['type'] ?? '', self::TIPOS_IMAGEN_PERMITIDOS, true)) {
            $errores['imagen'] = 'La imagen debe ser JPG, PNG, WEBP o GIF';
        } elseif (($archivo['size'] ?? 0) > self::TAMANO_MAXIMO_IMAGEN) {
            $errores['imagen'] = 'La imagen no puede pesar más de 5 MB';
        }

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }
    }

    /**
     * Validación y sanitización del lado del servidor.
     * No confía en que el frontend ya haya validado.
     *
     * @throws ValidacionException
     */
    private function validarYSanitizar(array $entrada, bool $esActualizacion = false): array
    {
        $errores = [];

        $nombre = trim(strip_tags($entrada['nombre'] ?? ''));
        if ($nombre === '') {
            $errores['nombre'] = 'El nombre es obligatorio';
        }

        $precio = filter_var($entrada['precio'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($precio === false || $precio < 0) {
            $errores['precio'] = 'El precio debe ser un número mayor o igual a 0';
        }

        $stock = filter_var($entrada['stock'] ?? null, FILTER_VALIDATE_INT);
        if ($stock === false || $stock < 0) {
            $errores['stock'] = 'El stock debe ser un número entero mayor o igual a 0';
        }

        $umbralMinimo = filter_var($entrada['umbral_minimo'] ?? 0, FILTER_VALIDATE_INT);
        if ($umbralMinimo === false || $umbralMinimo < 0) {
            $errores['umbral_minimo'] = 'El umbral mínimo debe ser un número entero mayor o igual a 0';
        }

        $descripcion = trim(strip_tags($entrada['descripcion'] ?? ''));

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }

        return [
            'nombre' => $nombre,
            'precio' => $precio,
            'stock' => $stock,
            'umbral_minimo' => $umbralMinimo,
            'descripcion' => $descripcion,
        ];
    }
}
