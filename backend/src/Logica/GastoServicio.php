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
     * @throws ValidacionException
     */
    public function listar(string $token, ?string $desde = null, ?string $hasta = null): array
    {
        $filtros = ['sort' => '-fecha'];

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

        return $this->repositorio->listar($token, $filtros);
    }

    /**
     * @throws ValidacionException
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

    // Formato estricto YYYY-MM-DD. Se valida antes de meter el valor
    // en el filtro de PocketBase, para no armar un filtro con datos
    // arbitrarios del usuario.
    private function esFechaValida(string $fecha): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $fecha);
        return $d !== false && $d->format('Y-m-d') === $fecha;
    }
}
