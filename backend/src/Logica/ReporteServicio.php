<?php

namespace App\Logica;

use App\Data\ReporteRepositorio;

class ReporteServicio
{
    private const TIPOS_VALIDOS = ['ventas', 'gastos', 'inventario'];

    public function __construct(private ReporteRepositorio $repositorio)
    {
    }

    public function listar(string $token): array
    {
        // TEMPORAL (diagnóstico): sin sort, para confirmar si el error
        // 400 de PocketBase viene de ordenar por 'created'.
        return $this->repositorio->listar($token, []);
    }

    /**
     * @param array|null $archivo Entrada de $_FILES['archivo']
     * @throws ValidacionException
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
            if (!$this->esFechaValida($fechaInicio)) {
                $errores['fecha_inicio'] = 'La fecha inicial no es válida';
            }
            if (!$this->esFechaValida($fechaFin)) {
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
     * @return array{contenido: string, tipo: string}
     * @throws ValidacionException
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

    private function esFechaValida(string $fecha): bool
    {
        $d = \DateTime::createFromFormat('Y-m-d', $fecha);
        return $d !== false && $d->format('Y-m-d') === $fecha;
    }
}
