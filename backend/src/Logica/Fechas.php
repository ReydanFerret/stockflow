<?php

namespace App\Logica;

/**
 * Utilidades de fechas compartidas por los servicios que filtran o
 * validan rangos (ventas, gastos, reportes). Antes esta lógica estaba
 * copiada en cada servicio; acá queda en un solo lugar.
 */
class Fechas
{
    /**
     * Verifica que el texto sea una fecha real en formato estricto
     * YYYY-MM-DD (rechaza, por ejemplo, "2026-02-31" o "2026-9-1").
     */
    public static function esValida(string $fecha): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $fecha);
        return $d !== false && $d->format('Y-m-d') === $fecha;
    }

    /**
     * Arma el filtro de PocketBase para un rango de fechas sobre el
     * campo "fecha", por ejemplo:  fecha >= "2026-09-01" && fecha <= "2026-09-30".
     *
     * Valida ambas fechas ANTES de meterlas en el filtro, para no armar
     * una consulta con datos arbitrarios que mandó el usuario.
     *
     * @param string|null $desde Fecha inicial (YYYY-MM-DD) o null si no hay límite inferior.
     * @param string|null $hasta Fecha final (YYYY-MM-DD) o null si no hay límite superior.
     * @return string|null El filtro, o null si no se pidió ningún rango.
     * @throws ValidacionException si alguna fecha no es válida.
     */
    public static function construirFiltro(?string $desde, ?string $hasta): ?string
    {
        $condiciones = [];

        if ($desde !== null) {
            if (!self::esValida($desde)) {
                throw new ValidacionException(['desde' => 'La fecha inicial no es válida']);
            }
            $condiciones[] = "fecha >= \"{$desde}\"";
        }

        if ($hasta !== null) {
            if (!self::esValida($hasta)) {
                throw new ValidacionException(['hasta' => 'La fecha final no es válida']);
            }
            $condiciones[] = "fecha <= \"{$hasta}\"";
        }

        return empty($condiciones) ? null : implode(' && ', $condiciones);
    }
}
