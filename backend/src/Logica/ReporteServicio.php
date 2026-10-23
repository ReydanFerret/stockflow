<?php

namespace App\Logica;

use App\Data\ReporteRepositorio;

class ReporteServicio
{
    private const TIPOS_VALIDOS = ['ventas', 'gastos', 'inventario'];

    public function __construct(private ReporteRepositorio $repositorio)
    {
    }

    /**
     * Lista el historial de reportes generados (sin filtros ni orden
     * particular: el frontend los muestra tal como vienen).
     *
     * @throws \App\Data\PocketBaseException
     */
    public function listar(string $token): array
    {
        return $this->repositorio->listar($token, []);
    }

    /**
     * Valida y guarda un reporte (PDF) junto con su tipo y rango de fechas.
     * El tipo "inventario" es una foto del stock actual, por eso no
     * lleva rango de fechas.
     *
     * @param array      $entrada Campos del formulario: tipo, fecha_inicio, fecha_fin.
     * @param array|null $archivo Entrada de $_FILES['archivo'] (debe ser un PDF).
     * @throws ValidacionException si el tipo, las fechas o el archivo son inválidos.
     */
    public function registrar(array $entrada, ?array $archivo, string $token): array
    {
        $errores = [];

        $tipo = $entrada['tipo'] ?? '';
        if (!in_array($tipo, self::TIPOS_VALIDOS, true)) {
            $errores['tipo'] = 'Tipo de reporte inválido';
        }

        $fechaInicio = trim($entrada['fecha_inicio'] ?? '');
        $fechaFin = trim($entrada['fecha_fin'] ?? '');

        // El inventario es una foto del stock actual: no lleva rango
        // de fechas, así que no lo exigimos para ese tipo.
        if ($tipo !== 'inventario') {
            if (!Fechas::esValida($fechaInicio)) {
                $errores['fecha_inicio'] = 'La fecha inicial no es válida';
            }
            if (!Fechas::esValida($fechaFin)) {
                $errores['fecha_fin'] = 'La fecha final no es válida';
            }
        }

        if ($archivo === null || ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            $errores['archivo'] = 'Falta el archivo del reporte';
        } elseif (($archivo['type'] ?? '') !== 'application/pdf') {
            $errores['archivo'] = 'El reporte debe ser un archivo PDF';
        }

        if (!empty($errores)) {
            throw new ValidacionException($errores);
        }

        $datos = ['tipo' => $tipo];
        if ($tipo !== 'inventario') {
            $datos['fecha_inicio'] = $fechaInicio;
            $datos['fecha_fin'] = $fechaFin;
        }

        return $this->repositorio->crearConArchivo($datos, ['archivo' => $archivo], $token);
    }

    /**
     * Devuelve los bytes del PDF de un reporte para que reporte-archivo.php
     * lo entregue como descarga.
     *
     * @return array{contenido: string, tipo: string}
     * @throws ValidacionException si el reporte no tiene archivo cargado.
     */
    public function obtenerArchivo(string $id, string $token): array
    {
        $reporte = $this->repositorio->obtenerPorId($id, $token);
        $nombreArchivo = $reporte['archivo'] ?? '';

        if ($nombreArchivo === '') {
            throw new ValidacionException(['archivo' => 'El reporte no tiene archivo cargado']);
        }

        return $this->repositorio->obtenerArchivo($id, $nombreArchivo, $token);
    }

}
