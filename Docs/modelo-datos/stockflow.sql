-- =====================================================================
-- StockFlow - Modelo relacional (SQLite 3)
-- Equivalente lógico de las colecciones de PocketBase (pb_schema.json).
-- PocketBase persiste en SQLite: cada colección es una tabla, el campo
-- "id" es la PK y cada campo "relation" es una FK.
-- Se omiten columnas internas del motor (tokenKey, emailVisibility,
-- verified) y el hash lo genera PocketBase con bcrypt al crear el usuario.
-- =====================================================================
PRAGMA foreign_keys = ON;

-- ------------------------------ DDL ----------------------------------

CREATE TABLE usuarios (
    id            TEXT PRIMARY KEY,                -- PK (15 caracteres, generado por PocketBase)
    cedula        TEXT NOT NULL UNIQUE,            -- identificador de login
    email         TEXT UNIQUE,                     -- contacto opcional
    nombre        TEXT NOT NULL,
    apellido      TEXT NOT NULL,
    telefono      TEXT,
    estado        INTEGER NOT NULL DEFAULT 1 CHECK (estado IN (0, 1)),
    rol           TEXT NOT NULL CHECK (rol IN ('vendedor', 'administrador', 'repositor')),
    password_hash TEXT NOT NULL                    -- bcrypt (lo aplica PocketBase)
);

CREATE TABLE productos (
    id             TEXT PRIMARY KEY,
    nombre         TEXT NOT NULL UNIQUE,
    precio         REAL NOT NULL CHECK (precio >= 0),
    stock          INTEGER NOT NULL CHECK (stock >= 0),
    imagen         TEXT,                           -- nombre del archivo (máx. 5 MB)
    descripcion    TEXT,
    umbral_minimo  INTEGER CHECK (umbral_minimo >= 0)
);

-- Un usuario realiza N ventas (1:N). Una venta es de un solo producto (1:N producto-ventas).
CREATE TABLE ventas (
    id              TEXT PRIMARY KEY,
    usuario_id      TEXT NOT NULL,                 -- FK: quién realizó la venta
    producto_id     TEXT NOT NULL,                 -- FK: qué se vendió
    precio_unitario REAL NOT NULL CHECK (precio_unitario >= 0),  -- precio histórico al momento de vender
    cantidad        INTEGER NOT NULL CHECK (cantidad >= 1),
    fecha           TEXT NOT NULL,                 -- YYYY-MM-DD
    hora            TEXT,                          -- HH:MM
    creado          TEXT,
    actualizado     TEXT,
    FOREIGN KEY (usuario_id)  REFERENCES usuarios (id)  ON DELETE RESTRICT,
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE RESTRICT
);

-- Un usuario registra N gastos (1:N).
CREATE TABLE gastos (
    id           TEXT PRIMARY KEY,
    usuario_id   TEXT NOT NULL,                    -- FK: quién registró el gasto
    categoria    TEXT NOT NULL CHECK (categoria IN (
                    'otros', 'impuestos', 'publicidad', 'transporte', 'mantenimiento',
                    'salarios', 'pago_servicios', 'compra_mercaderia', 'alquiler')),
    concepto     TEXT NOT NULL,
    metodo_pago  TEXT,
    observacion  TEXT,
    monto        REAL NOT NULL CHECK (monto >= 0),
    fecha        TEXT NOT NULL,
    hora         TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT
);

CREATE TABLE reportes (
    id            TEXT PRIMARY KEY,
    tipo          TEXT NOT NULL CHECK (tipo IN ('inventario', 'gastos', 'ventas')),
    fecha_inicio  TEXT,
    fecha_fin     TEXT,
    archivo       TEXT,                            -- PDF generado
    creado        TEXT,
    actualizado   TEXT
);

CREATE INDEX idx_ventas_fecha    ON ventas (fecha);
CREATE INDEX idx_ventas_usuario  ON ventas (usuario_id);
CREATE INDEX idx_ventas_producto ON ventas (producto_id);
CREATE INDEX idx_gastos_fecha    ON gastos (fecha);
CREATE INDEX idx_gastos_usuario  ON gastos (usuario_id);

-- ------------------------------ DML ----------------------------------
-- Datos de ejemplo basados en los productos de las capturas de la entrega.
-- Los password_hash son marcadores: en el sistema real los genera
-- PocketBase (bcrypt) al crear el usuario por la API.

INSERT INTO usuarios (id, cedula, nombre, apellido, telefono, estado, rol, password_hash) VALUES
 ('usr000000000001', '12345678', 'Ana',   'Pérez', '099111222', 1, 'administrador', '$2a$10$HASH_DE_EJEMPLO_ADMIN'),
 ('usr000000000002', '23456789', 'Luis',  'Gómez', '099333444', 1, 'vendedor',      '$2a$10$HASH_DE_EJEMPLO_VENDEDOR'),
 ('usr000000000003', '34567890', 'Marta', 'Silva', '099555666', 1, 'repositor',     '$2a$10$HASH_DE_EJEMPLO_REPOSITOR');

INSERT INTO productos (id, nombre, precio, stock, imagen, descripcion, umbral_minimo) VALUES
 ('prd000000000001', 'Mouse Gamer',     25, 15, 'mouse.png',  NULL, 5),
 ('prd000000000002', 'Teclado Mecánico', 60,  8, NULL,        'Teclado mecánico de tamaño completo (104 teclas), conexión USB.', 3),
 ('prd000000000003', 'Auriculares',     40, 12, 'auri.png',   'Auriculares inalámbricos, batería de 4 a 6 horas, carga rápida.', 4);

INSERT INTO ventas (id, usuario_id, producto_id, precio_unitario, cantidad, fecha, hora) VALUES
 ('vta000000000001', 'usr000000000002', 'prd000000000001', 25, 1, '2026-03-28', '14:05'),
 ('vta000000000002', 'usr000000000002', 'prd000000000002', 60, 2, '2026-04-05', '16:45'),
 ('vta000000000003', 'usr000000000001', 'prd000000000003', 40, 1, '2026-06-12', '09:50');

INSERT INTO gastos (id, usuario_id, categoria, concepto, metodo_pago, observacion, monto, fecha, hora) VALUES
 ('gst000000000001', 'usr000000000001', 'compra_mercaderia', 'Compra de Mercadería', 'Transferencia', 'Proveedor TechMarket', 850, '2026-01-03', '09:30'),
 ('gst000000000002', 'usr000000000001', 'pago_servicios',    'Pago de Internet',     'Débito',        'Factura mensual',      75, '2026-02-15', '14:15'),
 ('gst000000000003', 'usr000000000001', 'publicidad',        'Publicidad en Redes',  'Crédito',       'Campaña de Instagram', 220, '2026-03-28', '11:40');

INSERT INTO reportes (id, tipo, fecha_inicio, fecha_fin, archivo) VALUES
 ('rep000000000001', 'gastos', '2026-07-12', '2026-07-15', NULL);

-- ----------------------- Consultas de verificación -------------------
-- Ventas con vendedor y producto (JOIN por las FK):
--   SELECT v.fecha, u.nombre, p.nombre AS producto, v.cantidad, v.cantidad * v.precio_unitario AS total
--   FROM ventas v JOIN usuarios u ON u.id = v.usuario_id LEFT JOIN productos p ON p.id = v.producto_id;
