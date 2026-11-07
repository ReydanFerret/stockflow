<?php
/**
 * Copiar este archivo como config.php (mismo directorio) y completar
 * con los valores reales. config.php está en .gitignore: nunca se sube
 * al repositorio.
 */

return [
    // URL base donde corre PocketBase. Como PHP y PocketBase viven en
    // la misma VM Ubuntu, se usa localhost: el tráfico nunca sale del
    // servidor.
    'pocketbase_url' => 'http://127.0.0.1:8090',

    // Origen exacto del frontend en GitHub Pages (esquema + host,
    // SIN la ruta /stockflow/). Usado para el header CORS.
    'frontend_origin' => 'https://reydanferret.github.io',

    // Nombre de la cookie/sesión de la app
    'session_name' => 'stockflow_session',

    // Tiempo de vida del token de PocketBase en segundos (informativo,
    // el token real lo emite y valida PocketBase)
    'token_ttl' => 3600,
];
