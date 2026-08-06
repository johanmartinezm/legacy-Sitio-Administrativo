# Bitácora de QA - Proyecto Angular [ADMIN]

Entrada de trabajo para validación de Panel Administrativo.

### [2026-08-06]: Resumen de la encuesta del evento

- **Alcance:**
  - `Modelo`: `src/app/core/models/survey.model.ts` (nuevo) — `EventSurveySummary` y
    `EventSurveyComment`. Los promedios se tipan como `number | null`, **no** como `number`: una
    pregunta opcional puede no tener ni una respuesta, y ahí un 0 se leería como "pésimo" en vez de
    "sin datos".
  - `Servicio`: `src/app/core/services/event.service.ts` — `getEventSurveySummary()`, que consume
    `GET /api/events/{id}/survey/summary`. Esa ruta existe en el backend **desde el 2026-08-05 y no
    la mostraba nadie**; con esto se cierra la fase 3 del módulo de eventos.
  - `Componente`: `src/app/features/admin/survey-summary-dialog/` (nuevo) — diálogo con la nota
    general, las cuatro medias, el porcentaje que recomendaría el evento y los comentarios. Sigue el
    lenguaje visual de `feedback-dialog`, del que **no es sustituto**: aquél lista las
    calificaciones de cada taller, éste resume el evento completo.
  - `Tabla de eventos`: `manage-events` gana un segundo botón (icono `poll`, verde) junto al de
    feedback.
  - **El 403 tiene su propio mensaje.** La ruta es `AdminOnly`, así que ese error significa que se
    está entrando con un token que no es de administrador; un "error al cargar" genérico mandaría a
    buscar el problema al sitio equivocado.
  - `ng build --configuration production` pasa. Los dos avisos (presupuesto de bundle y `qrcode`
    como CommonJS) son anteriores a este cambio.
- **Criterios de QA:**
  1. **El botón está:** en "Administrar Eventos", cada fila muestra ahora dos iconos de consulta —
     la estrella amarilla (feedback por taller) y el gráfico verde (encuesta del evento).
  2. **Evento con respuestas:** abrir la encuesta muestra la nota general, las cuatro medias con su
     barra y los comentarios con su fecha.
  3. **Pregunta sin respuestas:** la media correspondiente dice "Sin respuestas". **No debe
     mostrarse 0,0 ni una barra vacía**, que se leería como la peor nota.
  4. **Evento sin encuestas:** mensaje "Todavía nadie respondió la encuesta de este evento", no una
     tabla vacía ni un error.
  5. **Sin comentarios pero con notas:** las medias se ven y debajo dice "Nadie dejó comentarios
     escritos".
  6. **Porcentaje de recomendación:** coherente con las respuestas (si las 2 de 2 recomiendan, 100%).
  7. **Con token que no sea de administrador:** "Esta información es solo para administradores".

### [2026-07-26]: Módulo de Foros Anónimos (Sitio Administrativo)
- **Alcance:**
  - `Modelos y Servicios`: `src/app/core/models/forum.model.ts`, `src/app/core/services/forum-admin.service.ts`
  - `Componentes`: `src/app/features/admin/forums/forums.component.ts`, `src/app/features/admin/forum-flagged-posts/forum-flagged-posts.component.ts`
  - `Rutas y Navegación`: `src/app/app.routes.ts`, `src/app/core/layout/main-layout/main-layout.component.html`
- **Criterios de QA:**
  1. Ingresar al Sitio Administrativo y validar que en el menú lateral de la izquierda, dentro de la sección "App Móvil", existan las nuevas opciones: "Administrar Foros" y "Posts Reportados".
  2. En "Administrar Foros", validar que se muestre la lista de foros pendientes de aprobación y la lista de foros activos.
  3. Validar los botones "Aprobar", "Rechazar" y "Eliminar" foro. Deben pedir confirmación y actualizar el listado.
  4. En "Posts Reportados", validar que aparezca el listado de posts con más de un reporte de spam/contenido.
  5. Validar que se pueda eliminar permanentemente un post controversial desde el panel administrativo.

---

### [2026-02-27]: Gestión Completa de Administradores y Separación Estricta
- **Alcance:**
  - `backend/go/`: Implementación de CRUD completo para `admin_users`.
  - `backend/go/cmd/server/main.go`: Protección de endpoints de gestión con `AdminOnly`.
  - `angular/legacy-app/`: Creación de módulo de gestión de Administradores.
  - `angular/legacy-app/src/app/core/layout/`: División del menú lateral.

- **Funcionalidad Nueva:**
  - **Módulo de Administradores:** Sección dedicada para crear, listar, editar y eliminar administradores del sistema.
  - **Separación de Login:** El login de la app móvil (Flutter) ya no permite el acceso de cuentas administrativas, y viceversa.
  - **Seguridad de Endpoints:** Los endpoints de gestión de usuarios regulares ahora requieren explícitamente el rol de `admin`.

- **Criterios de QA (Puntos a Validar):**
  1. **Gestión de Admins:** En la ruta `/admin/administrators`, validar que se pueden crear nuevos admins y eliminarlos.
  2. **Nomenclatura de Menú:** Verificar que el menú lateral ahora muestra "Usuarios App" y "Administradores" por separado.
  3. **Seguridad Robusta:** Intentar acceder a `/api/users` (lista de usuarios app) con un token de usuario regular; el servidor debe retornar `403 Forbidden` (o ser bloqueado por el middleware).
  4. **Edición de Admins:** Validar que el diálogo de edición carga correctamente los datos del administrador seleccionado.


### [2026-03-10]: Script de Compilación para Producción WEB (Angular)
- **Alcance:**
  - `Sitio-Administrativo/build_web.sh`: Nuevo script para estandarizar el build de Angular.
- **Funcionalidad Nueva:**
  - **Single Script Build:** Facilita la compilación del frontend automatizando el uso de `ng build --configuration production`.
- **Criterios de QA (Puntos a Validar):**
  1. **Compilación Angular:** Ejecutar `./build_web.sh` y verificar que genera la carpeta `dist/legacy-app`.
  2. **Configuración de Producción:** Confirmar que se aplica la optimización de producción por defecto.

### [2026-06-21]: Creación y Gestión de Grupos de Usuarios (Corrección del Botón de Creación)
- **Alcance:**
  - `Sitio-Administrativo/src/app/features/admin/groups/groups.component.html`: Corrección de la validación del botón "+ Crear Grupo" e input de nombre de grupo.
- **Funcionalidad Nueva:**
  - **Corrección de Validación de Formulario:** Se eliminó el atributo nativo `required` del input de nombre y se vinculó el estado deshabilitado del botón "+ Crear Grupo" directamente al valor de control de formulario. Esto soluciona el problema de que el botón se quedaba deshabilitado.
- **Criterios de QA (Puntos a Validar):**
  1. **Habilitación de Botón de Creación:** Escribir un nombre de grupo válido y verificar que el botón "+ Crear Grupo" se habilite inmediatamente.
  2. **Validación de Errores Visuales:** Borrar el contenido del input después de interactuar y verificar que se muestre el error "El nombre es requerido".

### [2026-06-27]: Dockerización y Despliegue de Sitio Administrativo (Angular & Nginx)
- **Alcance:**
  - `Sitio-Administrativo/Dockerfile` (file:///Volumes/Disco2T/desarrollo/Legacy/appLegaci/Sitio-Administrativo/Dockerfile)
  - `Sitio-Administrativo/docker-compose.yml` (file:///Volumes/Disco2T/desarrollo/Legacy/appLegaci/Sitio-Administrativo/docker-compose.yml)

- **Funcionalidad Nueva/Actualizada:**
  - **Dockerización del Frontend**: Contenedorización de la aplicación Angular utilizando Nginx (`nginx:alpine`) para servir los archivos estáticos compilados en `dist/legacy-app/browser`.
  - **Configuración de Servidor**: Uso de `nginx.conf` optimizado con gzip y routing fallback a `index.html`.
  - **Despliegue Independiente**: Desplegado en un contenedor separado (`legacy_frontend`) escuchando en el puerto 80 del servidor.

- **Criterios de QA (Puntos a Validar):**
  1. **Inicialización**: Verificar que el contenedor `legacy_frontend` esté activo y respondiendo en el puerto 80.
  2. **Navegabilidad**: Acceder a `http://143.198.179.55` y verificar que cargue la interfaz del Sitio Administrativo.
  3. **Rutas HTML5**: Navegar a una subruta y recargar la página en el navegador; validar que Nginx sirva correctamente `index.html` en lugar de retornar error 404.

### [2026-07-15]: Componente de Confirmación de Correo Electrónico
- **Alcance:**
  - `src/app/features/auth/verify-email/verify-email.component.ts` (nuevo)
  - `src/app/features/auth/verify-email/verify-email.component.html` (nuevo)
  - `src/app/features/auth/verify-email/verify-email.component.scss` (nuevo)
  - Actualizaciones en `src/app/app.routes.ts` y `src/app/core/services/auth.service.ts`
- **Criterios de QA (Puntos a Validar):**
  1. **Verificación de URL:** Acceder a `https://legacy.intelyclick.com/verify-email?token=TEST_TOKEN` (usando un token válido generado por backend) y verificar que la página confirme el correo exitosamente.
  2. **URL inválida:** Entrar a la ruta sin token y validar que indique "Enlace inválido o incompleto".
  3. **Token expirado:** Entrar a la ruta con un token expirado/usado y comprobar que muestre un error adecuado indicando el intento fallido.

### [2026-07-26]: Moderación de Foros Anónimos (Sitio Administrativo)
- **Alcance:**
  - `Modelos y Servicios`: `src/app/core/models/forum.model.ts`, `src/app/core/services/forum-admin.service.ts`
  - `Componentes`: `src/app/features/admin/forums/forums.component.ts`, `src/app/features/admin/forums/forums.component.html`
- **Criterios de QA:**
  1. En la sección "Administrar Foros", validar que se muestre la lista consolidada de todos los foros activos y bloqueados (Solo Lectura).
  2. Validar que el botón "Bloquear" ponga el foro en estado "Solo Lectura", impidiendo nuevos comentarios desde la App.
  3. Validar que el botón "Desbloquear" vuelva a activar el foro.
  4. Validar que el botón "Eliminar" foro funcione, eliminando el foro y todos sus posts.
