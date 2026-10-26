<?php

namespace App\Logica;

use App\Data\VentaRepositorio;
use App\Data\ProductoRepositorio;
use App\Data\PocketBaseException;

class VentaServicio
{
    public function __construct(
        private VentaRepositorio $repositorio,
        private ProductoRepositorio $productoRepositorio,
    ) {
    }

    /**
     * Lista las ventas, de la más reciente a la más antigua, con el
     * nombre del producto vendido ("producto_nombre") ya aplanado.
     *
     * @param string      $token Token del usuario logueado.
     * @param string|null $desde Fecha inicial YYYY-MM-DD (opcional).
     * @param string|null $hasta Fecha final YYYY-MM-DD (opcional).
     * @throws ValidacionException si alguna fecha tiene formato inválido.
     */
    public function listar(string $token, ?string $desde = null, ?string $hasta = null): array
    {
        $filtros = [
            'sort' => '-fecha',
            'expand' => 'producto',
        ];

        // Filtro opcional por rango de fechas (valida el formato YYYY-MM-DD).
        $condicion = Fechas::construirFiltro($desde, $hasta);
        if ($condicion !== null) {
            $filtros['filter'] = $condicion;
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

    /**
     * Registra una venta. Pasos, en este orden:
     *  1. Valida precio, cantidad y producto (reglas del servidor).
     *  2. Comprueba que el producto exista y que haya stock suficiente,
     *     ANTES de guardar nada.
     *  3. Crea la venta con la fecha y hora actuales del servidor.
     *  4. Descuenta el stock del producto.
     *     (El vendedor queda asociado a la venta por la FK "usuario".)
     *
     * @param array  $entrada   Datos del formulario: precio_unitario, cantidad, producto_id.
     * @param string $usuarioId Id del vendedor logueado.
     * @param string $token     Token del usuario logueado.
     * @return array La venta creada, con "producto_nombre".
     * @throws ValidacionException si los datos son inválidos o no hay stock.
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
            // FK a usuarios: quién realizó la venta (relación 1:N "Realiza" del MER)
            'usuario' => $usuarioId,
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

        $venta['producto_nombre'] = $producto['nombre'] ?? null;

        return $venta;
    }
}
