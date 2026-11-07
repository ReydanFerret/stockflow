# Modelo de datos de StockFlow

Persistencia: PocketBase, que almacena en **SQLite**. Cada colección es una tabla, el campo `id` es la clave primaria y cada campo *relation* es una clave foránea.

| Archivo | Contenido |
|---|---|
| `pb_schema.json` | Export real de las colecciones de PocketBase |
| `stockflow.sql` | DDL + DML equivalentes en SQLite (PK, FK, UNIQUE, CHECK, datos de ejemplo) |
| `er-stockflow.png` / `.dot` | Diagrama entidad-relación con PK y FK |
| `migracion-fk-usuario.sql` | Paso de tablas intermedias a FK `usuario` |

## Modelo relacional

```
usuarios  (PK id, cedula UNIQUE, email UNIQUE, nombre, apellido, telefono, estado, rol, password_hash)
productos (PK id, nombre UNIQUE, precio, stock, imagen, descripcion, umbral_minimo)
ventas    (PK id, FK usuario_id -> usuarios, FK producto_id -> productos, precio_unitario, cantidad, fecha, hora)
gastos    (PK id, FK usuario_id -> usuarios, categoria, concepto, metodo_pago, observacion, monto, fecha, hora)
reportes  (PK id, tipo, fecha_inicio, fecha_fin, archivo)
```

Relaciones: un usuario realiza muchas ventas (1:N), un usuario registra muchos gastos (1:N), un producto aparece en muchas ventas (1:N).

Las relaciones "Realiza" y "Registra" del MER de la primera entrega se modelaron primero como tablas intermedias (`ventas_realizadas`, `registros`). Como cada venta y cada gasto tiene un único usuario responsable, la cardinalidad real es 1:N y se reemplazaron por una FK, lo que elimina dos tablas y dos escrituras por operación.

## Comportamiento ante borrados

- `ventas.usuario_id` y `gastos.usuario_id`: `ON DELETE RESTRICT`. No se puede borrar un usuario con ventas o gastos; para darlo de baja se usa `estado`.
- `ventas.producto_id`: `ON DELETE RESTRICT`. No se puede borrar un producto que tiene ventas, para no perder el historial.

## Justificación de la Tercera Forma Normal (3FN)

**1FN.** Todos los atributos son atómicos; no hay grupos repetidos ni listas dentro de un campo. Cada fila se identifica por su `id`.

**2FN.** Todas las tablas tienen clave primaria simple (`id`), por lo que no puede existir dependencia parcial de una parte de la clave.

**3FN.** Ningún atributo no clave depende de otro atributo no clave:
- `ventas` no guarda el total ni el nombre del producto: el total se calcula (`cantidad × precio_unitario`) y el nombre se obtiene por la FK.
- `precio_unitario` en `ventas` no es una redundancia con `productos.precio`: es el precio vigente **al momento de la venta**. Si el precio del producto cambia, las ventas pasadas no deben modificarse. Es un dato propio de la venta.
- `usuarios.rol` y `gastos.categoria` son dominios cerrados validados por `CHECK`; no tienen atributos propios, por lo que no justifican una tabla aparte.
- Los datos del usuario (nombre, apellido, rol) viven solo en `usuarios`; `ventas` y `gastos` los referencian por FK.

**Cédula como clave candidata.** `usuarios.cedula` es `UNIQUE` y se usa para el login, pero la PK es `id` para no depender de un dato de negocio que podría corregirse.

## Reproducir el modelo

```
sqlite3 stockflow.db < stockflow.sql
```
