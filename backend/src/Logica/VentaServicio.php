<?php

namespace App\Logica;

use App\Data\VentaRepositorio;
use App\Data\VentaRealizadaRepositorio;
use App\Data\ProductoRepositorio;
use App\Data\PocketBaseException;

class VentaServicio
{
    public function __construct(
        private VentaRepositorio $repositorio,
        private VentaRealizadaRepositorio $ventaRealizadaRepositorio,
        private ProductoRepositorio $productoRepositorio,
    ) {
    }

    /**
     * @throws ValidacionException
     */
    public function listar(string $token, ?string $desde = null, ?string $hasta = null): array
    {
        $filtros = [
            'sort' => '-fecha',
            'expand' => 'producto',
        ];

        $condiciones = [];

        if ($desde !== null) {
            if (!$this->esFechaValida($desde)) {
                throw new ValidacionException(['desde' => 'La fecha inicial no es válida']);
            }
            $condiciones[] = "fecha >= \"{$desde}\"";
        }

        if ($hasta !== null) {
            if (!$this->esFechaValida($hasta)) {
                throw new ValidacionException(['hasta' => 'La fecha final no es válida']);
            }
            $condiciones[] = "fecha <= \"{$hasta}\"";
        }

        if (!empty($condiciones)) {
            $filtros['filter'] = implode(' && ', $condiciones);
        }

        $ventas = $this->repositorio->listar($token, $filtros);

        // Aplanamos el nombre del producto expandido para que el
        // frontend no tenga que lidiar con la estructura anidada
        // de PocketBase (venta.expand.producto.nombre).
        foreach ($ventas as &$venta) {
            $productoExpandido = $venta['expand']['producto'] ?? null;
            $venta['producto_nombre'] = $productoExpandido['nombre'] ?? null;
        }
        unset($venta);

        return $ventas;
    }

    // Formato estricto YYYY-MM-DD. Se valida antes de meter el valor
    // en el filtro de PocketBase, para no armar un filtro con datos
    // arbitrarios del usuario.
    private function esFechaValida(string $fecha): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $fecha);
        return $d !== false && $d->format('Y-m-d') === $fecha;
    }

    /**
     * @throws ValidacionException
     */
    public function crear(array $entrada, string $usuarioId, string $token): array
    {
        $errores = [];

        $precioUnitario = filter_var($entrada['precio_unitario'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($precioUnitario === false || $precioUnitario < 0) {
            $errores['precio_unitario'] = 'El precio unitario debe ser un número mayor o igual a 0';
        }

        $cantidad = filter_var($entrada['cantidad'] ?? null, FILTER_VALIDATE_INT);
        if ($cantidad === false || $cantidad < 1) {
            $errores['cantidad'] = 'La cantidad debe ser un número entero mayor a 0';
        }

        $productoId = $entrada['producto_id'] ?? null;
        if (empty($productoId)) {
            $errores['producto_id'] = 'Debe seleccionar un producto';
        }

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }

        // Verificamos el producto y el stock disponible ANTES de
        // registrar nada. Esto evita crear una venta "huérfana" si
        // el producto no existe o no hay stock suficiente.
        try {
            $producto = $this->productoRepositorio->obtenerPorId($productoId, $token);
        } catch (PocketBaseException $e) {
            throw new ValidacionException(['producto_id' => 'El producto no existe']);
        }

        $stockActual = (int) ($producto['stock'] ?? 0);
        if ($stockActual < $cantidad) {
            throw new ValidacionException([
                'cantidad' => "Stock insuficiente. Disponible: {$stockActual}",
            ]);
        }

        $ahora = new \DateTime();

        $datosVenta = [
            'precio_unitario' => $precioUnitario,
            'cantidad' => $cantidad,
            'fecha' => $ahora->format('Y-m-d'),
            'hora' => $ahora->format('H:i'),
            'producto' => $productoId,
        ];

        $venta = $this->repositorio->crear($datosVenta, $token);

        // Descontamos el stock. Nota: esto es un read-then-write, no
        // un incremento atómico. Con el cliente actual de PocketBase
        // no hay forma de pedir "restá N" en una sola operación, así
        // que existe una ventana teórica de condición de carrera si
        // dos vendedores venden el mismo producto en simultáneo.
        $this->productoRepositorio->actualizar(
            $productoId,
            ['stock' => $stockActual - $cantidad],
            $token
        );

        // Registra la relación M:N "Realiza" (Usuario <-> Venta) del MER
        $this->ventaRealizadaRepositorio->crear([
            'usuario' => $usuarioId,
            'venta' => $venta['id'],
        ], $token);

        $venta['producto_nombre'] = $producto['nombre'] ?? null;

        return $venta;
    }
}
