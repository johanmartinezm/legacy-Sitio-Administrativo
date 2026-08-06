# Despliegue del panel administrativo

Guía para publicar el back-office Angular, que se sirve en la raíz de
`https://legacy.intelyclick.com`.

> Este repositorio es **público**. No añadas aquí ni en ningún archivo versionado la IP del
> servidor, el usuario SSH ni contraseñas.

## Cómo está montado producción

```
Internet ──► HAProxy (80/443, Let's Encrypt)
                │
                ├──►  legacy_frontend   nginx:alpine   ← este proyecto, en la raíz "/"
                └──►  legacy_backend    API Go         ← rutas /api/... y /health
```

El contenedor se llama `legacy_frontend`, cuelga de la red Docker **externa** `proxy-net` y **no
publica puertos**: solo HAProxy tiene acceso desde fuera. HAProxy vive en un proyecto aparte que no
está en este repositorio.

## 1. Confirmar a qué API va a apuntar

Esta es la parte que más confunde del proyecto, porque hay **dos** mecanismos y solo uno manda.

**El que manda: `src/assets/config/config.json`.** `ConfigService` lo carga por HTTP con un
`APP_INITIALIZER` (`app.config.ts`) antes de que arranque la aplicación, y todos los servicios leen
`this.config.apiUrl`. Ya apunta a producción:

```json
{ "apiUrl": "https://legacy.intelyclick.com", "production": true }
```

Como se resuelve **en tiempo de ejecución**, este archivo se puede editar dentro del contenedor
sin recompilar nada. Si la URL de la API cambia, no hace falta un build nuevo.

**Ojo con la duplicación.** El mismo archivo existe en `public/assets/config/config.json` y en
`src/assets/config/config.json`, y `angular.json` copia ambas rutas al mismo destino: uno
sobrescribe al otro en `dist`. Hoy tienen contenido idéntico; mantenlos así o elimina uno.

**El que no manda (salvo en un sitio): `src/environments/environment.ts`.** Solo existe la variante
de desarrollo, con `apiUrl: 'http://localhost:8080'`, y `angular.json` no declara
`fileReplacements`. Un único archivo lo importa:

```
src/app/core/services/payment.service.ts:4   import { environment } from '../../../environments/environment';
```

**Consecuencia real: en producción los pagos del panel apuntan a `http://localhost:8080` y
fallan.** El resto del panel funciona porque pasa por `ConfigService`. Arreglarlo es cambiar ese
servicio a `ConfigService` como los demás — no hace falta crear `environment.prod.ts`.

## 2. Compilar

```bash
npm ci                  # o npm install
./build_web.sh          # equivale a: ng build --configuration production
```

La salida queda en **`dist/legacy-app/browser`**, que es exactamente la ruta que copia el
`Dockerfile`. Si cambias `outputPath` en `angular.json`, hay que cambiar el `Dockerfile` también.

El build de producción aplica `outputHashing: "all"` y tiene presupuestos de tamaño: **1 MB de
error** para el bundle inicial y **20 kB por hoja de estilos de componente**. Superarlos hace
fallar el build, no solo advertir.

## 3. Construir la imagen y levantar

El `Dockerfile` **no compila**: copia `dist/legacy-app/browser` ya construido. Si te saltas el
paso 2, publicas la versión anterior sin ningún aviso.

```bash
docker compose up -d --build
```

Requiere que la red externa exista en el servidor:

```bash
docker network ls | grep proxy-net    # si falta: docker network create proxy-net
```

## 4. Verificar

1. **Carga:** abrir `https://legacy.intelyclick.com` y comprobar que aparece el panel con el
   candado del certificado.
2. **Config cargada:** en la consola del navegador debe verse `External config loaded: {apiUrl: ...}`.
   Si en su lugar aparece `Could not load external config, using fallback`, el `config.json` no
   llegó al contenedor y **todo el panel está apuntando a `localhost:8080`**.
3. **Rutas HTML5:** navegar a una subruta, recargar con F5 y confirmar que carga en vez de dar 404
   (lo resuelve el `try_files $uri $uri/ /index.html` de `nginx.conf`).
4. **Salud del contenedor:** `docker compose exec frontend wget -qO- localhost/health` → `OK`.
5. **Login real:** entrar con un usuario administrador y comprobar que la petición sale hacia el
   dominio público, no hacia `localhost`.

## Qué hace `nginx.conf`

- `try_files ... /index.html` — enrutado del lado del cliente (Angular Router).
- gzip nivel 9 sobre HTML, CSS, JS, JSON y XML.
- `expires 6M` en imágenes, fuentes, `.css` y `.js`. Es seguro porque `outputHashing: "all"` pone
  un hash en cada nombre de archivo; `index.html` no se cachea y siempre apunta a los hashes nuevos.
- `/health` devuelve `OK` sin registrar en el log.

## Actualizar solo la configuración, sin recompilar

Cuando lo único que cambia es la URL de la API:

```bash
docker compose exec frontend sh -c \
  'echo "{\"apiUrl\":\"https://nuevo-dominio\",\"production\":true}" > /usr/share/nginx/html/assets/config/config.json'
```

Es un cambio **efímero**: la próxima reconstrucción de la imagen lo revierte. Sirve para una
urgencia; el arreglo definitivo va en el repositorio.

## Rollback

No hay imágenes etiquetadas por versión. La vuelta atrás práctica es conservar el `dist` anterior:

```bash
mv dist/legacy-app dist/legacy-app.bak    # antes de compilar la versión nueva
# revertir:
rm -rf dist/legacy-app && mv dist/legacy-app.bak dist/legacy-app && docker compose up -d --build
```

## Antes de dar por cerrado un despliegue

```bash
npm audit --omit=dev
```

Y registra la entrega en `qa_bitacora.md` con el formato del proyecto: fecha, **Alcance** con los
archivos tocados y **Criterios de QA** numerados y verificables por una persona.

### El `npm audit` sale en rojo, y es una decisión consciente

Devuelve **10 vulnerabilidades altas**, todas colgando de `@angular/core`. **No se van a corregir
subiendo de versión**, por decisión tomada el 2026-08-06 tras analizarlas una por una. Si te las
encuentras, no hace falta volver a investigarlas:

| Aviso | Por qué no aplica aquí |
|---|---|
| 3 de `HttpTransferCache` (clave débil, caché de peticiones con credenciales, ambigüedad de clave) | `HttpTransferCache` **solo existe con SSR**. Este panel es una SPA: no hay `@angular/ssr` ni `provideClientHydration` |
| Fuga de token XSRF por URLs protocol-relative | No se usa ninguna URL `//host/...`; todo sale de `config.apiUrl`, que es absoluta y con `https://` |
| 2 de DoS por OOM en `formatDate` y `digitsInfo` | Requieren que el **patrón** lo controle un atacante. No se llama a `formatDate` ni a `formatNumber` en ningún sitio, y los formatos de las plantillas son literales del código |

**Por qué no se actualiza.** No existe versión corregida en 18.x ni en 19.x: el arreglo llega en
Angular 20/21. `npm audit fix --force` instala **Angular 21**, tres majors por encima, y arrastra:

- **`@zxing/ngx-scanner`** —el escáner de QR del control de acceso— que solo publica versiones para
  Angular 21 y 22.
- **Angular Material**, cuyo sistema de temas cambió a M3 entre medias, con lo que el aspecto del
  panel cambiaría y habría que revisar pantalla por pantalla.

O sea: una migración con riesgo real sobre un panel que funciona, para cerrar avisos que aquí no
son explotables.

**Cuándo hay que revisar esta decisión:**

1. Si el panel adopta **SSR** o hidratación — ahí los tres avisos de `HttpTransferCache` pasan a ser
   reales de inmediato.
2. Si aparece un aviso nuevo que **sí** aplique (por ejemplo, un XSS en el propio framework).
3. Cuando haya ventana para la migración con QA completo del panel.

## Límites conocidos

- **Los permisos son binarios.** `core.admin_users.role` admite un único valor: o el usuario es
  administrador y puede todo, o no entra. No hay granularidad por módulo.
- **No hay subida de archivos.** Los campos de imagen son texto donde se pega una URL, porque
  `ImageHandler.UploadImage` existe en el backend pero nunca se registró en el router.
- **El token vive en `localStorage`** (`adminAuthToken`, inyectado por
  `core/interceptors/auth.interceptor.ts`). Sin protección CSRF ni sanitización de HTML en el
  backend, cualquier XSS en el panel expone la sesión de administrador.
