# stockflow
|Arreglo de errores|Añadir features nuevas|Editar estilos|Cambios menores|Cambios en documentación|Refactorizar el código|
| :--- | :---: | :---: | :---: | :---: | ---: |
|fix(section):descripción|feat(sección):descripción|style(sección):descripción|chore:descripción|docs(sección):descripción|refactor(sección):descripción|


Convención de versionado:

StockFlow utiliza un esquema de versionado con el formato Mayor.Menor (X.Y).

Versión Mayor (X): representa una versión estable y completa del sistema. La versión 1.0 corresponderá a la entrega final del proyecto, en la que todas las funcionalidades previstas estarán implementadas y listas para su presentación.

Versión Menor (Y): identifica las distintas versiones de desarrollo previas a la versión estable. Cada nueva entrega o conjunto importante de mejoras incrementa este número.

Por este motivo, las versiones del proyecto serán:

0.1: Primera entrega (versión inicial con funcionalidades básicas).

0.2: Segunda entrega (incorpora nuevas funcionalidades y mejoras respecto a la versión anterior).

1.0: Tercera entrega o versión final, correspondiente al sistema completo y estable presentado en la defensa.

## Modelo de datos

El modelo relacional (PK/FK), el DDL/DML en SQL, la justificación de 3FN y el
export de PocketBase están en [`Docs/modelo-datos/`](Docs/modelo-datos/README.md).

## Despliegue con Docker
 
El sistema se despliega en una VM con Ubuntu Server mediante Docker Compose, con dos servicios:
 
| Servicio | Contenedor | Imagen base | Contenido | Puerto (solo local) |
| :--- | :--- | :--- | :--- | :---: |
| `pocketbase` | `stockflow-pocketbase` | `alpine:3.20` | PocketBase 0.39.6 (base de datos y panel de administración) | 8090 |
| `backend` | `stockflow-backend` | `php:8.4-cli` | Backend PHP que sirve `backend/public/` | 8000 |
 
Ambos puertos se publican solo en `127.0.0.1` de la VM, por lo que no son accesibles directamente desde la red. Los dos servicios tienen `restart: always` y la base de datos se guarda en el volumen `pb_data/`, que se conserva al reconstruir los contenedores.
 
### Acceso desde Internet
 
Tailscale Funnel publica los dos servicios por HTTPS, sin abrir puertos en el router:
 
| URL pública (nodo `.ts.net`) | Destino en la VM |
| :--- | :--- |
| `https://<nodo>.ts.net` (puerto 443) | `http://127.0.0.1:8090` (panel de PocketBase) |
| `https://<nodo>.ts.net:8443` | `http://127.0.0.1:8000` (backend PHP) |
 
La URL del backend que usa el frontend está en una sola línea, en `api.js` (`API_BASE`). Funnel solo admite los puertos 443, 8443 y 10000. El estado se verifica con `tailscale funnel status`.
 
### Estructura relevante
 
```
docker-compose.yml
pocketbase/Dockerfile          # Alpine + descarga de PocketBase 0.39.6
backend/Dockerfile             # PHP 8.4, copia el backend y sirve public/ en el puerto 8000
backend/.dockerignore
backend/config/config.example.php
```
 
### Puesta en marcha
 
1. Instalar Docker y Docker Compose en el servidor y clonar el repositorio. La imagen de PocketBase descarga el binario desde GitHub al construirse, por lo que el servidor necesita conexión a Internet en ese momento.
2. Crear la configuración real a partir de la plantilla (no se versiona):
   ```bash
   cp backend/config/config.example.php backend/config/config.php
   ```
   y completar:
   - `pocketbase_url`: `http://pocketbase:8090` (nombre del servicio dentro de la red de Docker).
   - `frontend_origin`: `https://reydanferret.github.io` (único origen permitido por CORS).
   - `session_name` y `token_ttl`: nombre de la cookie de sesión y duración de la sesión.
3. Construir y levantar los contenedores:
   ```bash
   docker compose up -d --build
   ```
4. Abrir el panel de PocketBase (`/_/`), crear el superusuario cuando lo solicite e importar las colecciones desde `Docs/modelo-datos/pb_schema.json` (*Settings → Import collections*).
5. Exponer los servicios con Tailscale Funnel (puertos 443 y 8443, según la tabla anterior).
6. Si el backend cambia de dirección, actualizar `API_BASE` en `api.js`.
 
### Operación
 
| Acción | Comando |
| :--- | :--- |
| Ver el estado | `docker compose ps` |
| Ver los logs del backend | `docker compose logs -f backend` |
| Aplicar un cambio de código del backend | `docker compose up -d --build backend` |
| Detener todo (los datos se conservan) | `docker compose down` |
 
El código del backend se copia dentro de la imagen al construirla (`COPY . /app`), por lo que **cualquier cambio en `backend/` requiere reconstruir la imagen**.
 
### Zona horaria
 
`backend/src/bootstrap.php` fija la zona horaria `America/Montevideo`. Sin esto PHP usaría UTC (la del contenedor) y las ventas y gastos se registrarían con fecha y hora corridas.
 
### Respaldo
 
Con los contenedores detenidos, basta con copiar la carpeta `pb_data/`:
```bash
docker compose stop pocketbase
sudo cp -a pb_data pb_data-respaldo
docker compose start pocketbase
```
 
### Seguridad del despliegue
 
- `backend/config/config.php` y `pb_data/` están excluidos del repositorio mediante `.gitignore`.
- La cookie de sesión se emite con `HttpOnly`, `Secure` y `SameSite=None`; Funnel opera solo sobre TLS, lo que permite cumplir la exigencia de HTTPS.
- Los puertos de los contenedores solo escuchan en `127.0.0.1`: el único acceso externo es el que publica Funnel.
- El backend usa el servidor embebido de PHP (`php -S`), adecuado para desarrollo y demostración. En producción se reemplazaría por Apache o Nginx con PHP-FPM, sin modificar el código de la aplicación.
