<?php

namespace App\Logica;

use App\Data\GastoRepositorio;
use App\Data\RegistroRepositorio;

class GastoServicio
{
    private const CATEGORIAS_VALIDAS = [
        'otros', 'impuestos', 'publicidad', 'transporte', 'mantenimiento',
        'salarios', 'pago_servicios', 'compra_mercaderia', 'alquiler',
    ];

    public function __construct(
        private GastoRepositorio $repositorio,
        private RegistroRepositorio $registroRepositorio,
    ) {
    }

    /**
     * Lista los gastos, del más reciente al más antiguo.
     *
     * @param string      $token Token del usuario logueado.
     * @param string|null $desde Fecha inicial YYYY-MM-DD (opcional).
     * @param string|null $hasta Fecha final YYYY-MM-DD (opcional).
     * @throws ValidacionException si alguna fecha tiene formato inválido.
     */
    public function listar(string $token, ?string $desde = null, ?string $hasta = null): array
    {
        $filtros = ['sort' => '-fecha'];

        // Filtro opcional por rango de fechas (valida el formato YYYY-MM-DD).
        $condicion = Fechas::construirFiltro($desde, $hasta);
        if ($condicion !== null) {
            $filtros['filter'] = $condicion;
        }

        return $this->repositorio->listar($token, $filtros);
    }

    /**
     * Registra un gasto con la fecha y hora actuales del servidor y deja
     * constancia de quién lo cargó en la relación Usuario-Gasto ("Registra").
     *
     * @param array  $entrada   Datos del formulario: concepto, monto, categoria, metodo_pago, observacion.
     * @param string $usuarioId Id del usuario (administrador) que lo registra.
     * @param string $token     Token del usuario logueado.
     * @return array El gasto creado.
     * @throws ValidacionException si concepto o monto son inválidos.
     */
    public function crear(array $entrada, string $usuarioId, string $token): array
    {
        $errores = [];

        $concepto = trim(strip_tags($entrada['concepto'] ?? ''));
        if ($concepto === '') {
            $errores['concepto'] = 'El concepto es obligatorio';
        }

        $monto = filter_var($entrada['monto'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($monto === false || $monto <= 0) {
            $errores['monto'] = 'El monto debe ser un número mayor a 0';
        }

        // La categoría y el método de pago vienen del frontend en texto
        // libre (el select de la UI permite "Otro"); se normalizan a
        // slug para que encajen con el select fijo de PocketBase, o se
        // guardan como "otros"/texto libre si no matchea ninguno.
        $categoria = $this->normalizarCategoria($entrada['categoria'] ?? '');
        $metodoPago = trim(strip_tags($entrada['metodo_pago'] ?? ''));

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }

        $ahora = new \DateTime();

        $gasto = $this->repositorio->crear([
            'categoria' => $categoria,
            'concepto' => $concepto,
            'metodo_pago' => $metodoPago,
            'observacion' => trim(strip_tags($entrada['observacion'] ?? '')),
            'monto' => $monto,
            'fecha' => $ahora->format('Y-m-d'),
            'hora' => $ahora->format('H:i'),
        ], $token);

        // Registra la relación M:N "Registra" (Usuario <-> Gasto) del MER
        $this->registroRepositorio->crear([
            'usuario' => $usuarioId,
            'gasto' => $gasto['id'],
        ], $token);

        return $gasto;
    }

    /**
     * Convierte la categoría que viene del formulario (texto libre, ej.
     * "Compra de mercadería") al valor fijo que acepta PocketBase
     * (ej. "compra_mercaderia"). Si no coincide con ninguna, devuelve "otros".
     */
    private function normalizarCategoria(string $categoriaTexto): string
    {
        $mapa = [
            'compra de mercadería' => 'compra_mercaderia',
            'pago de servicios' => 'pago_servicios',
            'alquiler' => 'alquiler',
            'salarios' => 'salarios',
            'mantenimiento' => 'mantenimiento',
            'transporte' => 'transporte',
            'publicidad' => 'publicidad',
            'impuestos' => 'impuestos',
        ];

        $clave = strtolower(trim($categoriaTexto));

        return $mapa[$clave] ?? 'otros';
    }

}
