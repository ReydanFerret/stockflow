-- =====================================================================
-- Migración: de tablas intermedias (ventas_realizadas, registros)
-- a FK "usuario" dentro de ventas y gastos.
--
-- ORDEN:
--  0. Hacer una copia de pb_data/data.db.
--  1. En el panel de PocketBase, agregar a "ventas" y a "gastos" un campo
--     Relation "usuario" -> usuarios
--  2. Detener PocketBase y ejecutar este script sobre pb_data/data.db.
--  3. Iniciar PocketBase, marcar "usuario" como Requerido en ventas y gastos.
--  4. Borrar las colecciones ventas_realizadas y registros desde el panel.
--  5. Re-exportar las colecciones y reemplazar pb_schema.json en el repo.
-- =====================================================================
BEGIN;

UPDATE ventas
SET usuario = (SELECT vr.usuario FROM ventas_realizadas vr WHERE vr.venta = ventas.id LIMIT 1)
WHERE (usuario IS NULL OR usuario = '');

UPDATE gastos
SET usuario = (SELECT r.usuario FROM registros r WHERE r.gasto = gastos.id LIMIT 1)
WHERE (usuario IS NULL OR usuario = '');

-- Verificación: ambas consultas deben devolver 0
SELECT COUNT(*) AS ventas_sin_usuario FROM ventas WHERE usuario IS NULL OR usuario = '';
SELECT COUNT(*) AS gastos_sin_usuario FROM gastos WHERE usuario IS NULL OR usuario = '';

COMMIT;
