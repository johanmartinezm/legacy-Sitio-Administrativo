# Bitácora de QA - Proyecto Angular [ADMIN]

Entrada de trabajo para validación de Panel Administrativo.

### [2026-08-26]: Las tablas grandes del panel piden páginas, no la tabla entera

Contraparte de la entrada del mismo día en `Backend/qa_bitacora.md`, que trae el detalle del diseño
—`X-Total-Count`, el techo de 200 y por qué los inscritos dejan de ordenarse por nombre—.

**Lo que más cuidado exigió no fue paginar, sino no romper lo que dependía de la lista completa.**

- **`getUsers()` tiene cuatro consumidores** y tres de ellos necesitan **todas** las cuentas: el
  selector de miembros de un grupo, el envío de notificaciones y el selector de inscripción. Si
  hubiera pasado a devolver la primera página, esos tres se habrían quedado callando a la gente que no
  cupiera —un grupo al que le faltan miembros— **sin que nada lo avisara**.
  - **La solución:** `getUsersPage()` para la tabla, y `getUsers()` sigue devolviendo todo pero
    **recorriendo páginas por dentro**, del tamaño máximo que acepta el backend. Ninguna consulta
    pide más de 200 filas y ningún consumidor se entera.
- **La pantalla de inscritos tampoco puede trabajar con una página**, y su propio comentario ya lo
  avisaba («si algún día pagina, este es el punto a rehacer»). Busca por nombre, correo y teléfono
  —cifrados en la base, así que el servidor no puede buscarlos— y calcula los totales, **incluido lo
  recaudado**. Con una página, esa cifra de dinero habría mostrado una fracción sin avisar. Usa
  `getAllEventRegistrants()`, que recorre páginas igual.
- **Sí paginan de verdad, contra el servidor:** la tabla de usuarios (50 por página, con selector de
  25/50/100/200) y la bandeja de contacto (25). No se usa `MatTableDataSource` a propósito: eso
  pagina en memoria lo que ya se trajo, que es justo lo que se quería evitar.
- **Al cambiar de filtro en la bandeja se vuelve a la primera página.** Sin eso, pasar de «Todos»
  —estando en la página 4— a «Nuevos» pediría un offset que en ese filtro no existe y la bandeja
  saldría vacía como si no hubiera mensajes.
- **Al borrar la última fila de la última página se retrocede una** y se vuelve a pedir: si no, la
  tabla queda vacía mientras el paginador dice que hay resultados.
- **Si la cabecera no llega**, el total cae al largo de la página en vez de a cero: con cero, el
  paginador diría que no hay resultados mientras se ven filas en pantalla.
- **Alcance:** `src/app/core/models/pagina.ts` (nuevo), `user.service.ts`, `event.service.ts`,
  `contacto.service.ts`, `users-list.component.ts` y `.html`, `contacto.component.ts` y `.html`,
  `event-registrants.component.ts`, `paginacion.spec.ts` (nuevo, 5 casos) y `user.service.spec.ts`
  (adaptado al contrato nuevo).
- **Verificado:** `npx tsc --noEmit` limpio, `ng build --configuration production` correcto, y la
  suite pasa de 53 a 58 specs en verde **con los mismos 7 fallos de antes** —los `should create`
  generados a los que les faltan providers, comprobado corriendo la suite con los cambios guardados
  aparte—.
- ⚠️ **No se pilotó en el navegador**: la extensión de Chrome no estaba conectada. Los criterios de QA
  de la entrada del backend son justo eso.

---

### [2026-08-26]: El nombre de un administrador ya se guarda y se ve

Sale de la misma auditoría que el arreglo de la fecha de publicación (ver `Backend/qa_bitacora.md`,
misma fecha): buscar campos que el panel no envía y el `UPDATE` sí escribe.

- **El problema:** el panel manda `firstName`/`lastName` y el backend lee `first_name`/`last_name`
  —el payload de `RegisterAdmin` y `domain.AdminUser`—, así que recibía cadena vacía y la escribía.
  `email` y `role` sí funcionaban, por ser una sola palabra: eso es lo que ocultaba el fallo.
- **En producción los tres administradores tienen el nombre y el apellido en blanco.** No es que se
  hubieran borrado: nunca se guardaron. Y la lista los pintaba vacíos porque leía `admin.firstName`
  de un DTO que trae `first_name`.
- **Reproducido contra el backend local**, que es la prueba de que era eso y no otra cosa:

  ```
  PUT con {"firstName":"Camel","lastName":"Case"}   -> HTTP 200, en la base quedó  [ | ]
  PUT con {"first_name":"QA","last_name":"Status"}  -> HTTP 200, en la base quedó  [QA|Status]
  ```

- **El fix:** `aDto()` y `desdeDto()` en `AdminService`, que traducen en las dos direcciones. Mismo
  patrón que ya usaba `user.service.ts`, que por eso no tenía este problema.
- **La contraseña va aparte** en el alta: es el único campo que no vive en el modelo.
- **Un administrador sin nombre no rompe la lista**: `desdeDto` devuelve cadena vacía, que es como
  están los tres de producción hasta que alguien los reedite.
- **Alcance:** `src/app/core/services/admin.service.ts`,
  `src/app/core/services/admin-nombres.spec.ts` (nuevo, 4 casos).
- **Verificado:** `npx tsc --noEmit` limpio y los 4 specs en verde.
- **Desplegado el 2026-08-26**, con respaldo previo del `dist` publicado.
- ⚠️ **Los tres administradores de producción siguen sin nombre.** El arreglo no los rellena solo: hay
  que abrir cada uno en el panel, escribir nombre y apellido y guardar.
- **Criterios de QA:**
  1. **Abrir «Administradores»**: la columna «Nombre» sigue vacía en los tres (todavía no se han
     reeditado), pero ya no es un fallo del panel.
  2. **Editar uno**, ponerle nombre y apellido y guardar: la lista los muestra al recargar.
  3. **Crear un administrador nuevo** con nombre: aparece con su nombre, no en blanco.
  4. **Volver a abrirlo a editar**: los dos campos vienen rellenos.

---

### [2026-08-26]: Editar un evento virtual desde el panel ya no lo convierte en presencial

Salió al tocar los mapeos de `event.service.ts` para la entrada de aquí abajo. **Es pérdida de datos
en silencio, y estaba en producción.**

- **El problema:** `mapDtoToEvent` no leía `isVirtual` ni `accessUrl`, y `mapEventToDto` tampoco los
  enviaba. Como el `PUT` del backend escribe `is_virtual` y `access_url` **siempre**, cada guardado
  desde el panel los dejaba en `false` y `NULL`. O sea: **abrir una masterclass virtual, guardar sin
  tocar nada, y quedaba convertida en presencial y sin enlace de sesión**. Y como el formulario
  tampoco leía la modalidad, la casilla aparecía desmarcada al abrir, de modo que ni siquiera había
  un síntoma visible antes de guardar.
- **Lo que rompe aguas abajo:** `isVirtual` decide qué recibe quien se inscribe —los presenciales dan
  QR de acceso, los virtuales el enlace de la sesión—. Quien se inscribiera después del guardado
  recibía un QR para una masterclass que se da por videollamada.
- **Comprobado contra el entorno local** antes y después, con el cuerpo exacto que arma el panel:

  ```
  antes:   true  | https://legacynetworkco.com/aula
  PUT del panel -> HTTP 200
  después: false | (null)          <- antes del arreglo
  después: true  | https://legacynetworkco.com/aula   <- después
  ```

- **El fix:** los dos campos viajan en los dos mapeos. El diálogo ya hacía su parte bien —manda
  `accessUrl: null` cuando se desmarca la casilla—, el corte estaba solo en el servicio.
- **Afecta también a crear**, no solo a editar: es el mismo `mapEventToDto`. Un evento virtual creado
  desde el panel nacía presencial.
- ⚠️ **Hay que revisar producción.** Cualquier evento virtual guardado desde el panel desde el
  2026-08-18 —cuando se añadió la modalidad— habrá perdido su enlace. La consulta:

  ```sql
  SELECT id, title, is_virtual, access_url FROM events.events WHERE is_virtual = false;
  ```

  Los que deberían ser virtuales hay que volver a marcarlos y ponerles su enlace a mano.
- **Alcance:** `src/app/core/services/event.service.ts` (los dos mapeos),
  `src/app/core/services/event-status.spec.ts` (5 casos más, 10 en total).
- **Verificado:** `npx tsc --noEmit` limpio, `ng build --configuration production` correcto, 10 specs
  en verde, y los dos sentidos ejercitados contra el backend local: guardar un virtual conserva
  modalidad y enlace, y desmarcar la casilla lo pasa a presencial borrando el enlace, que es lo que
  debe hacer.
- **Criterios de QA:**
  1. **Abrir a editar una masterclass virtual**: la casilla «virtual» aparece **marcada** y el enlace
     de la sesión relleno.
  2. **Guardar sin tocar nada** y volver a abrir: sigue virtual y con su enlace.
  3. **Inscribirse desde la app** a esa masterclass: llega el enlace de la sesión, no un QR.
  4. **Desmarcar la casilla** y guardar: pasa a presencial y el enlace se borra, que es lo correcto.
  5. **Crear un evento virtual nuevo** desde el panel: nace virtual, no presencial.

---

### [2026-08-26]: El panel muestra qué eventos están ocultos, y deja reactivarlos

Contraparte de la entrada del mismo día en `Backend/qa_bitacora.md`, que trae el detalle del problema
y la migración que hace falta aplicar.

- **El problema, del lado del panel:** desde el 25-08 la app solo lista los eventos `active`, pero
  esta pantalla no conocía esa columna. Un evento oculto se veía aquí **exactamente igual** que uno
  visible —ni una marca que los distinguiera— y no había ninguna forma de volver a mostrarlo: el
  formulario no envía `status` y el `PUT` del evento lo ignora, así que solo se podía por SQL.
- **El fix:** columna «En la app» con un chip Visible/Oculto, y un botón de ojo que llama a
  `EventService.updateStatus()`, contra la ruta nueva `PUT /api/events/{id}/status`.
- **`updateStatus` va aparte de `updateEvent` a propósito.** Si el guardado del formulario llevara
  `status`, lo mandaría vacío —el formulario no tiene ese campo— y el evento dejaría de verse en la
  app al editarlo. Hay un spec que fija que el `PUT` del formulario **no** envía el campo.
- **Un DTO sin `status` se da por visible**, no por oculto: pintar «Oculto» sobre eventos que la app
  sí está mostrando sería peor que no pintar nada.
- **Se pide confirmación** antes de cambiarlo, porque el efecto no se ve en esta pantalla sino en la
  app de quien la tenga abierta. Y el `subscribe` lleva callback de `error` con `MatSnackBar`: sin él
  un fallo dejaría la lista igual que estaba y parecería que se guardó, que es el mismo descuido que
  tenía el guardado de usuarios hasta el 22-08.
- **De paso, los tooltips de esta pantalla vuelven a funcionar.** Los cinco botones de acciones usaban
  `matTooltip` sin que nadie importara `MatTooltipModule`, así que ninguno mostraba nada al pasar el
  ratón. Hacía falta para el botón nuevo, cuyo icono no se explica solo.
- **Y el spec generado de la pantalla, que fallaba desde siempre**, ya pasa: le faltaban
  `HttpClientTestingModule`, `RouterModule` y `NoopAnimationsModule`.
- **Alcance:** `src/app/core/models/event.model.ts`, `src/app/core/services/event.service.ts`,
  `src/app/features/admin/manage-events/manage-events.component.ts`, `.html` y `.scss`,
  `src/app/core/services/event-status.spec.ts` (nuevo, 5 casos),
  `src/app/features/admin/manage-events/visibilidad-evento.spec.ts` (nuevo, 6 casos),
  `manage-events.component.spec.ts` (arreglado).
- **Verificado:** `npx tsc --noEmit` limpio, `ng build --configuration production` correcto, y los 12
  specs en verde, incluido el que renderiza la tabla y comprueba que los dos chips salen distintos.
- **Desplegado el 2026-08-26**, junto con el backend y con el arreglo de la modalidad de aquí arriba.
  Respaldo del `dist` publicado antes de reemplazarlo (`dist.bak.20260826_1541`) y
  `docker compose up -d --build`. Comprobado desde fuera: el chunk que trae la columna nueva
  (`chunk-AFBGIOIF.js`) lo sirve el dominio con 200.
- **Revisado de paso el daño de la modalidad en producción:** de los siete eventos, solo uno es
  virtual y **conserva su enlace**. Los otros seis figuran como presenciales; si alguno debería ser
  virtual —«Planificación Patrimonial en la Era Digital» y «Sesión de bienvenida Legacy Network» son
  los candidatos por el título—, hay que marcarlo y ponerle su enlace a mano, porque el arreglo evita
  nuevas pérdidas pero no recupera las viejas.
- ⚠️ **No se pilotó en el navegador**: la extensión de Chrome no estaba conectada. Los criterios 1 y 2
  son justo eso.
- **Criterios de QA** (con la migración del backend aplicada):
  1. **Abrir «Administrar Eventos»**: hay una columna «En la app» con «Visible» en verde y «Oculto»
     en gris, y un botón de ojo en las acciones.
  2. **Pasar el ratón por los botones de acciones**: ahora sí sale el texto de cada uno.
  3. **Ocultar un evento visible** y aceptar la confirmación: el chip cambia, sale el aviso abajo y el
     evento desaparece del listado de la app.
  4. **Volver a mostrarlo**: reaparece en la app.
  5. **Cancelar la confirmación**: no cambia nada.
  6. **Editar un evento oculto** con el formulario de siempre y guardar: sigue oculto.

---

### [2026-08-25]: La pantalla de restablecer contraseña ya no necesita el correo

Contraparte de la entrada del mismo día en `Backend/qa_bitacora.md`, que trae el detalle del problema
(el correo viajaba en la URL del enlace de recuperación) y la migración que hace falta aplicar.

- **Qué cambia aquí:** `reset-password.component` deja de leer `email` de la URL y `AuthService.
  resetPassword()` deja de mandarlo; el backend lo resuelve desde el token.
- **Se quitó el campo «Email» de solo lectura** que mostraba la pantalla. Pedírselo al servidor solo
  para pintarlo volvería a exponer lo que se acaba de quitar del enlace, y no hace falta: el enlace
  llega al buzón de su dueño.
- **Los enlaces ya enviados siguen funcionando**: llevan el token, y el `&email=` sobrante se ignora.
- **Alcance:** `src/app/core/services/auth.service.ts`,
  `src/app/features/auth/reset-password/reset-password.component.ts` y `.html`.
- **Verificado:** `npx tsc --noEmit` limpio y `ng build --configuration production` correcto.
- **Criterios de QA** (con la migración del backend aplicada):
  1. **Abrir un enlace de recuperación** y cambiar la contraseña: funciona sin que la pantalla muestre
     el correo.
  2. **Abrir `/reset-password` sin token**: sale «El enlace de recuperación no es válido».
  3. **Un enlace antiguo** con `&email=`: sigue funcionando igual.

### [2026-08-25]: El panel y la app comparten el catálogo de país y tipo de documento

- **El problema:** el panel ofrecía **Colombia/Otro** y **`CC` / `CE` / `NIT` / `Pasaporte`**, mientras
  la app guarda diecisiete países y nombres largos (`Cédula`, `Cédula de extranjería`, `RUC`, `RFC`,
  `DNI`...). Como el valor se guarda tal cual, al abrir a editar a alguien registrado desde la app el
  desplegable **no encontraba su opción y se pintaba vacío**: parecía que el dato no estaba, y guardar
  lo borraba. Es lo que se vio como «"Tipo Id" no precarga» en la jornada del 21-08; el `FormControl`
  sí recibía el valor, lo que faltaba era la `mat-option`.
- **El fix:** `core/utils/identificacion.ts`, espejo de
  `App-Movil/lib/domain/utils/identificacion_empresarial.dart`. El formulario recorre ese catálogo en
  vez de tener las opciones escritas a mano.
- **Las cuentas antiguas no se rompen.** `tiposConValorActual()` añade el valor guardado cuando no
  está en el catálogo, así que quien tenga `CC` o `ID Extranjero` de antes lo sigue viendo y no lo
  pierde al guardar otra cosa.
- **Se quitó el `CC` por defecto** al crear: toda cuenta creada desde el panel nacía con un tipo que
  la app no sabe leer. Ahora nace vacío y hay que elegir.
- **Al cambiar de país se limpia el tipo** si deja de ser válido —un RUC peruano no existe en
  Colombia—, pero abrir a editar no toca nada: `valueChanges` no dispara con el valor inicial.
- **Ojo, es un espejo a mano:** si se toca el catálogo de la app hay que tocar este. Los dos
  repositorios son independientes y nada lo verifica solo.
- **Alcance:** `src/app/core/utils/identificacion.ts` (nuevo),
  `src/app/core/utils/identificacion.spec.ts` (nuevo, 8 casos),
  `src/app/features/admin/users/user-form-dialog/user-form-dialog.component.ts` y `.html`.
- **Verificado:** `npx tsc --noEmit` limpio, `ng build --configuration production` correcto, y los 8
  specs en verde.
- **Criterios de QA:**
  1. **Editar a alguien registrado desde la app** con país distinto de Colombia: «País» y «Tipo Id»
     aparecen con su valor, no vacíos.
  2. **Guardar sin tocar nada** y reabrir: los dos campos conservan lo que tenían.
  3. **Cambiar el país** de Colombia a Perú: el tipo se limpia y ofrece RUC, DNI, Pasaporte y Otro.
  4. **Editar una cuenta antigua** creada desde el panel (tipo `CC`): sigue mostrando `CC`, y se puede
     cambiar a `Cédula` sin error.
  5. **Crear un usuario nuevo**: «Tipo Id» empieza vacío y obliga a elegir.

### [2026-08-25]: El logo de la pantalla de verificación de correo ya carga

- **El problema:** `verify-email.component.html` apuntaba a `assets/images/logo-dark.png`, que **no
  existe** en `src/assets` ni en `public/` — era la única referencia a ese archivo en todo el
  repositorio. La pantalla salía con la imagen rota. Es la que abre cualquiera al verificar su correo
  tras registrarse desde la app, así que es de las primeras que ve un usuario nuevo.
- **El fix:** apunta a `/assets/images/logo.png`, el mismo que usa el login, con la barra inicial que
  ya usaban las otras dos pantallas.
- **Alcance:** `src/app/features/auth/verify-email/verify-email.component.html`.
- **Verificado:** `ng build --configuration production` correcto.
- **Criterios de QA:**
  1. Abrir el enlace de verificación de un registro nuevo: el logo se ve, no el icono de imagen rota.

### [2026-08-22]: El panel avisa si no pudo guardar un usuario

Contraparte de la entrada del mismo día en `Backend/qa_bitacora.md` («El panel ya puede editar una
cuenta con fecha de nacimiento»), que trae el detalle del bug de fondo (`PUT /api/users/{id}` devolvía
400 con cualquier fecha de nacimiento).

- **El problema, solo del lado del panel:** `users-list.component.ts` llamaba a
  `updateUser`/`createUser` sin callback de `error` en el `subscribe`. Cuando el backend rechazaba el
  guardado, el diálogo se cerraba igual que si hubiera ido bien —no había ningún síntoma en pantalla—,
  así que **cualquier fallo de guardado, no solo este, pasaba inadvertido**.
- **El fix:** ambas llamadas ahora usan `{ next, error }`, y el `error` muestra un `MatSnackBar` con
  «No se pudo guardar/crear el usuario. Inténtalo de nuevo.», siguiendo el mismo patrón que
  `banner-list.component.ts` y `reset-password.component.ts`.
- **Alcance:** `src/app/features/admin/users/users-list/users-list.component.ts`.
- **Verificado:** `npx tsc --noEmit` limpio, `ng build --configuration production` sin errores.
  Desplegado a producción junto con el fix del backend.
- **Criterios de QA:**
  1. Editar un usuario con datos válidos y guardar: se refresca la lista sin ningún aviso de error.
  2. Provocar un fallo de guardado (red cortada, o un dato que el backend rechace) y comprobar que
     aparece el aviso «No se pudo guardar el usuario. Inténtalo de nuevo.» en vez de cerrarse en
     silencio.

### [2026-08-20]: Los avisos del escáner por fin tienen color

Cierra C5 del recorrido manual.

- **El problema:** el escáner pedía `success-snackbar` y `error-snackbar` desde el commit inicial, pero
  **ninguna de las dos estaba definida en ninguna hoja de estilos**. Los avisos salían en el gris por
  defecto de Material, así que un check-in correcto y un QR inválido **se veían igual**.
- **Salió al confirmar C5**, que pedía que un código inválido saliera en rojo. Estaba escrito en el
  código y no ocurría.
- **Van en `styles.scss` y no en el `.scss` del componente**, que es la razón por la que no habrían
  funcionado igual: el snackbar se pinta en un overlay, fuera del árbol del componente, así que los
  estilos con ámbito de componente no le llegan nunca.
- **Tres estados, y cada uno dice algo distinto:**
  - **verde** — entró;
  - **ámbar** — ese código ya se había usado, pero el asistente es válido;
  - **rojo** — el código no sirve.
- **La relectura pasa de rojo a ámbar**, para que el aviso diga lo mismo que la tarjeta que ya sale en
  ámbar. Antes usaba `error-snackbar` y mezclaba dos mensajes: «no vale» y «ya entró» no son lo mismo,
  y en la puerta se actúa distinto.
- **Se usan las variables de Material** (`--mdc-snackbar-container-color` y compañía) en vez de
  sobrescribir selectores internos, que cambian entre versiones.
- **Verificado:** `npx tsc --noEmit` sin errores, `ng build --configuration production` completa, y
  desplegado: las dos clases viajan en el bundle publicado y el panel responde 200.
- **Criterios de QA:**
  1. **Escanear un QR válido:** el aviso sale en verde.
  2. **Escanear el mismo otra vez:** el aviso sale en ámbar, igual que la tarjeta.
  3. **Escanear un QR inventado:** el aviso sale en rojo.
  4. **Comparar los tres:** se distinguen de un vistazo, sin leer el texto.
  5. **Que el texto siga siendo legible** sobre los tres fondos.

### [2026-08-19]: El escáner avisa cuando el QR ya se había usado

- **Por qué:** el backend deja de registrar una segunda asistencia para el mismo código
  (`Backend/scripts/20260819_attendance_logs_una_por_inscripcion.sql`, F12.8 del plan de pruebas) y
  ahora manda `alreadyCheckedIn` en la respuesta del check-in. **El panel es el único sitio donde se
  escanea**, así que sin este cambio la corrección existiría sin que nadie en la puerta la viera: las
  dos pantallas seguían siendo idénticas y el mensaje seguía diciendo «¡Check-in exitoso!» sobre una
  entrada que no se había registrado.
- **Alcance:**
  - `features/admin/attendance-scanner/attendance-scanner.component.html` — aviso, icono y el texto de
    la hora.
  - `features/admin/attendance-scanner/attendance-scanner.component.ts` — el mensaje emergente.
  - `features/admin/attendance-scanner/attendance-scanner.component.scss` — el bloque del aviso.
- **Ámbar y no rojo, a propósito.** El asistente es válido; lo repetido es el escaneo. Un rojo de error
  invitaría a no dejarlo pasar, que es justo lo contrario de lo que hay que hacer.
- **Los datos del asistente se siguen mostrando** —nombre, correo, evento y talleres—: en la puerta se
  necesitan igual, y de hecho más, porque hay que decidir si el código se está compartiendo.
- **La hora que se ve es la de la primera entrada**, no la del escaneo actual, y la etiqueta cambia a
  «Entró a las» para que no se lea como si acabara de entrar.
- **El mensaje emergente también cambia**, y dura más: cinco segundos en vez de tres. Quien escanea mira
  el aviso, no la tarjeta.
- **No es un error, así que no se comporta como tal:** la respuesta sigue siendo 200 y la pantalla sigue
  siendo la de resultado. Si el backend devolviera 409, el escáner caería en su rama de error y no
  mostraría a quién pertenece el código.
- **Verificado:** `npx tsc --noEmit` sin errores y `ng build --configuration production` completa. Las
  dos advertencias que salen (presupuesto de bundle y `qrcode` en CommonJS) son anteriores.
- ✅ **Recorrido en producción el 2026-08-20 con el escáner real y un QR de verdad.** El primer escaneo
  salió verde; el segundo, ámbar con «Este código ya se había usado» y la hora de la primera entrada.
  El listado de inscritos del evento contó **un** asistente. Quedan por ver dos detalles: que la
  pantalla de relectura siga mostrando los datos del asistente, y que un QR inventado siga saliendo en
  rojo y no en ámbar.
- **Criterios de QA:**
  1. **Escanear un QR válido:** icono verde y «¡Check-in exitoso!», como siempre.
  2. **Escanear ese mismo QR otra vez:** icono ámbar, aviso «Este código ya se había usado» y la nota de
     que no se registró una entrada nueva.
  3. **Mirar la hora en esa segunda pantalla:** es la de la primera entrada, con la etiqueta «Entró a las».
  4. **Comprobar que siguen saliendo** el nombre, el correo y los talleres del asistente.
  5. **Escanear un QR inventado:** sigue saliendo el mensaje de error de siempre, no el aviso ámbar.
  6. **Ver los inscritos de ese evento:** cuenta un asistente, no dos.

### [2026-08-18]: Modalidad y enlace de acceso en el formulario de evento

- **Por qué:** los eventos ya distinguen presencial de virtual
  (`Backend/scripts/20260818_modalidad_y_enlace_evento.sql`), y **el panel es el único sitio donde se
  marca**. Sin este campo, todo evento nuevo nacería presencial y seguiría emitiendo QR para una
  masterclass virtual.
- **Alcance:**
  - `core/models/event.model.ts` — `isVirtual` y `accessUrl`.
  - `features/admin/event-form-dialog/` — casilla de modalidad, campo de enlace y su validación.
- **El campo del enlace solo aparece al marcar la casilla.** Un presencial no tiene enlace que pedir,
  y mostrarlo siempre invita a rellenarlo.
- **El enlace es obligatorio en los virtuales.** El validador se pone y se quita al marcar la casilla.
  Sin esto se podía guardar una masterclass virtual sin enlace, y quien se inscribiera se quedaba sin
  QR (por virtual) y sin enlace (por vacío): **sin nada**.
- **Un presencial no guarda enlace** aunque haya quedado escrito al marcar y desmarcar la casilla; se
  envía nulo.
- **La etiqueta dice "Masterclass virtual en vivo"**, el mismo nombre que usa la app desde hoy, en vez
  de "Virtual" a secas.
- **Verificado:** `npx tsc --noEmit` sin errores y `ng build --configuration production` completa —
  `tsc` no valida plantillas de Angular, así que el build es la comprobación que cuenta aquí. Las dos
  advertencias que salen (presupuesto de bundle y `qrcode` en CommonJS) son anteriores.
- **Criterios de QA:**
  1. **Crear un evento sin marcar la casilla:** no pide enlace y se guarda como presencial.
  2. **Marcar la casilla:** aparece el campo de enlace.
  3. **Intentar guardar un virtual sin enlace:** no deja, y explica por qué.
  4. **Guardar un virtual con enlace** y reabrirlo: la casilla sigue marcada y el enlace conservado.
  5. **Pasar un evento de virtual a presencial** y guardar: el enlace deja de almacenarse.
  6. **Abrir un evento anterior a la migración:** sale como presencial y sin enlace.
  7. **En la app**, una inscripción a ese evento virtual muestra el enlace y no el QR.

### [2026-08-18]: El rol "Miembro de junta o consejo" aparece en el panel

- **Por qué:** la app registra un cuarto perfil, `junta`, que hoy se añade al enum `core.user_role`
  del backend (`Backend/scripts/20260818_add_junta_user_role.sql`). El panel solo conocía tres, así
  que al editar una de esas cuentas el desplegable "Rol" salía vacío y al guardar le cambiaba el
  perfil sin que nadie lo pidiera.
- **Alcance:**
  - `core/models/user.model.ts` — `UserRole` suma `'junta'`.
  - `features/admin/users/user-form-dialog/user-form-dialog.component.html` — nueva opción del
    desplegable.
- **La etiqueta es "Miembro de junta o consejo"**, no "Junta", para que coincida con el texto que ve
  quien se registra en la app ("Quiero ser miembro de junta o consejo").
- **`profesional` se queda donde estaba.** No lo usa ni la app ni el backend, pero sigue en el enum y
  puede haber cuentas creadas con él desde este mismo desplegable.
- **El rol por defecto del formulario sigue siendo `familia`** (`user-form-dialog.component.ts:46`):
  es el mismo que aplica el backend cuando no llega ninguno.
- ⚠️ **Depende de la migración del backend.** Hasta que se aplique, guardar un usuario con rol
  `junta` desde el panel responderá 400.
- **Verificado:** `npx tsc --noEmit` sin errores. No hay spec de este diálogo; `user.service.spec.ts`
  usa `profesional` y no se toca.
- **Criterios de QA:**
  1. **Editar un usuario** en Usuarios: el desplegable "Rol" ofrece cuatro opciones, con "Miembro de
     junta o consejo" al final.
  2. **Abrir un usuario registrado desde la app como junta:** el desplegable aparece con esa opción
     ya seleccionada, no en blanco.
  3. **Guardar sin tocar el rol** no lo cambia.
  4. **Cambiar un usuario a "Miembro de junta o consejo"** y volver a abrirlo: el rol se conservó.
  5. **Los otros tres roles** siguen guardándose igual que antes.

### [2026-08-13]: Bandeja de "Mensajes de Contacto"

- **Por qué:** la pantalla Contáctenos de la app se estrenó hoy enviando solo un correo. Sin bandeja,
  nadie podía revisar qué se ha preguntado, ni saber si algo quedó sin responder, y **un fallo del
  SMTP hacía desaparecer el mensaje**. Ahora se guardan y esta pantalla es donde se atienden.
- **Alcance:**
  - `core/models/contacto.model.ts` y `core/services/contacto.service.ts` — nuevos. La URL sale de
    `ConfigService`, como el resto: se resuelve en ejecución, no en el build.
  - `features/admin/contacto/` — componente, plantilla y estilos, calcados de la bandeja de usuarios
    reportados para que las dos se usen igual.
  - `app.routes.ts` (`admin/contacto`) y la entrada **Mensajes de Contacto** en el menú lateral.
- **Los mensajes cuyo correo no salió se marcan en rojo** con "correo no enviado". Son los únicos que
  nadie vería de otra forma, y por eso es lo primero que destaca la lista.
- **Abrir un mensaje nuevo lo pasa a Leído**, que es lo que acaba de ocurrir; no hay que marcarlo a
  mano. "Responder por correo" abre el cliente con `Re: asunto` y lo deja en Respondido.
- **El estado se pinta antes de que conteste el servidor** para que la lista no parpadee, y **si la
  petición falla se revierte**: dejarlo cambiado haría creer que se atendió algo que no se guardó.
- **Verificado:** `ng build --configuration production` compila (los dos avisos, presupuesto de
  bundle y `qrcode` CommonJS, son anteriores) y **6 tests** pasan. **Desplegado en producción** el
  mismo día: raíz 200, `/admin/contacto` recargada 200, `/health` interno `OK`, `config.json` con la
  `apiUrl` de producción —no el fallback a localhost— y el bundle contiene la ruta nueva. `dist`
  anterior guardado como `dist.bak.20260813_contacto`.
- **Criterios de QA:**
  1. **Menú → Mensajes de Contacto**: carga la bandeja con el filtro "Nuevos".
  2. Enviar un mensaje desde la app y recargar: aparece arriba.
  3. **Abrirlo**: se ve el texto completo y pasa a Leído solo.
  4. **Responder por correo**: se abre el cliente con el destinatario y el asunto, y queda Respondido.
  5. Recorrer los cuatro filtros y comprobar que cada uno trae lo suyo.
  6. **Con una sesión que no sea de administrador**, entrar a la ruta: debe decir que es solo para
     administradores, no un error genérico.

### [2026-08-12]: El panel ya sube imágenes, en vez de pedir una URL

- **El problema:** ningún formulario permitía subir un archivo. Los campos de imagen eran texto donde
  había que pegar una URL, así que para poner la foto de un evento había que alojarla antes en otro
  sitio. El endpoint del backend (`POST /api/images/upload`) existe y está desplegado desde el 11 de
  agosto, pero solo lo usaba la app móvil.
- **Alcance:**
  - `core/services/image-upload.service.ts` — nuevo. Sube al endpoint y **devuelve la URL absoluta**,
    no el nombre suelto: es lo que ya guardan estos campos y lo que la app pinta tal cual con
    `Image.network`. Devolver el nombre obligaría a cambiar también la app.
  - `core/components/image-upload/` — nuevo. Campo reutilizable con vista previa, progreso y errores.
    Implementa `ControlValueAccessor`, así que se usa con `formControlName` igual que el input al que
    sustituye.
  - Conectado en **cinco campos**: banner, evento, taller de evento, portada de contenido y foto de
    perfil de usuario.
  - `core/services/image-upload.service.spec.ts` — 6 casos.
- **Se conserva la caja de texto** a propósito: los valores ya guardados son URL escritas a mano, y
  muchas apuntan a imágenes de la web corporativa que no tiene sentido volver a subir. Quitarla
  obligaría a rehacerlas todas.
- **Validación previa en el navegador** con los mismos límites del servidor —imagen y 10 MB— para no
  gastar una subida entera en un error previsible. El servidor la repite, que es donde cuenta.
- **Verificado:** `ng build --configuration production` compila (los dos avisos, presupuesto de
  bundle y `qrcode` CommonJS, son anteriores); los 6 tests pasan.
- **Desplegado en producción el mismo día.** `dist` anterior guardado en el servidor como
  `dist.bak.20260813_0104`. Comprobado tras recrear el contenedor: raíz 200, `/health` interno `OK`,
  `config.json` servido con `apiUrl` de producción —no el fallback a `localhost`—, una subruta
  recargada da 200, y el chunk que contiene `images/upload` se sirve desde el dominio público. La API
  siguió respondiendo durante todo el despliegue. `npm audit --omit=dev` sigue con las 10 altas de
  siempre, analizadas y descartadas el 2026-08-06.
- **Criterios de QA:**
  1. **Crear un banner** subiendo un archivo: aparece la vista previa y, tras guardar, la imagen se
     ve en el listado del panel y en la app.
  2. **Editar un banner que ya tenía una URL pegada**: debe seguir viéndose y poder guardarse sin
     tocar la imagen.
  3. **Subir un archivo que no sea imagen** (un PDF): avisa sin llamar al servidor.
  4. **Subir una imagen de más de 10 MB**: avisa antes de subirla.
  5. **Una imagen muy ancha** (más de 600 px) se guarda reducida: el servidor la redimensiona.
  6. **Con la sesión caducada**, subir muestra el aviso de volver a iniciar sesión, no un error
     genérico.
  7. Repetir el punto 1 en **evento, taller, contenido y foto de perfil**.
  8. **Quitar** una imagen deja el campo vacío y permite guardar.

---

### [2026-08-11]: El módulo de pagos llamaba a localhost en producción

- **El problema:** `core/services/payment.service.ts` era **el único servicio del panel que importaba
  `environments/environment`**, cuyo `apiUrl` es `http://localhost:8080` y se fija al compilar. En el
  panel desplegado, crear un intento de pago o verificarlo llamaba al equipo de quien abriera el
  navegador, no al servidor: el módulo entero no funcionaba fuera de una máquina de desarrollo.
- **El arreglo:** pasa a `ConfigService`, como el resto de servicios, que lee `assets/config/
  config.json` con el `APP_INITIALIZER` en tiempo de ejecución. Así la URL se puede cambiar sin
  recompilar, que es el motivo por el que existe ese mecanismo.
- **Alcance:** `src/app/core/services/payment.service.ts`. Las dos llamadas comparten ahora un
  `apiUrl` privado, igual que en `banner_admin.service.ts`.
- **Efecto colateral que conviene saber:** con este cambio **ya nadie importa
  `src/environments/environment.ts`**. El archivo queda huérfano y se puede borrar, pero eso es otra
  entrega.
- **Verificado:** `ng build --configuration production` compila sin errores. Los dos avisos que
  salen —presupuesto de bundle superado y `qrcode` en CommonJS— son anteriores a este cambio.
- **Criterios de QA:**
  1. **En el panel desplegado**, abrir el módulo de pagos y comprobar en la pestaña Red del navegador
     que las llamadas van a `https://legacy.intelyclick.com/api/payments/...` y **no** a
     `localhost:8080`.
  2. **Crear un intento de pago** devuelve la URL del formulario, no un error de conexión.
  3. **Verificar un pago** por su `tx_id` responde con su estado.
  4. **En local** (`npm start` con el `config.json` de desarrollo), las mismas llamadas siguen yendo
     a `http://localhost:8080`.

---

### [2026-08-10]: Bandeja de usuarios reportados

- **Por qué:** la app ya permite reportar y bloquear personas (directriz 1.2 de Apple), y esos
  reportes llegaban a `GET /api/admin/user-reports` **sin que nadie los viera**. Sin esta pantalla se
  recogen denuncias que no atiende nadie.
- **No es lo mismo que "Posts Reportados".** Aquélla lista publicaciones de foro denunciadas; ésta,
  denuncias sobre **personas**, que llegan casi siempre desde un chat privado. Se han dejado como dos
  entradas distintas del menú a propósito.
- **Alcance:**
  - `core/models/user-report.model.ts` y `core/services/user-report.service.ts` (nuevos).
  - `features/admin/user-reports/` (nuevo), con ruta `admin/user-reports` en `app.routes.ts` y
    entrada **Usuarios Reportados** en el menú lateral (icono `person_off`).
  - **El backend se amplió para devolver los nombres** (`reporter_name`, `reported_name`) ya
    descifrados: los datos personales están cifrados y el panel no tiene la clave, así que una
    bandeja que mostrara UUIDs no serviría para decidir nada.
  - `Filtros` por estado: abre en **Pendientes**, que es lo que hay que atender.
  - `ng build --configuration production` pasa. `Tests`: `user-reports.component.spec.ts` (6 casos).
- **Marcar un reporte no bloquea ni elimina nada**, y la pantalla lo dice al pie: solo deja
  constancia de que se atendió. Las medidas sobre una cuenta se toman desde "Administrar Usuarios".
- **El contenido del mensaje denunciado no se muestra**, solo una marca de que el reporte señala uno:
  los mensajes de chat están cifrados y esta pantalla no los descifra.
- El 403 lleva su propio mensaje, como en las pantallas de encuesta e inscritos.
- **Criterios de QA:**
  1. **La entrada está:** en el menú lateral, bajo Foros, aparece "Usuarios Reportados".
  2. **Abre en Pendientes** y muestra los reportes hechos desde la app.
  3. **Los nombres son legibles**, no UUID ni texto cifrado. Es lo que más fácil se rompe, porque el
     descifrado ocurre en el backend.
  4. **Los filtros funcionan:** Pendientes, Revisados, Descartados y Todos.
  5. **Marcar como revisado** pide confirmación y el reporte sale de Pendientes.
  6. **Descartar** hace lo mismo y lo deja en Descartados.
  7. **Un reporte ya resuelto** no ofrece botones de acción.
  8. **Sin reportes:** mensaje claro, distinto según el filtro; sin tabla vacía.
  9. **Recarga con F5** estando en la pantalla: debe seguir cargando (enrutado HTML5 de nginx).
  10. **Sin rol de administrador:** "Esta información es solo para administradores".

### [2026-08-06]: Decisión sobre el `npm audit` — se mantiene Angular 18

- **Decisión:** las 10 vulnerabilidades altas que reporta `npm audit` **no se corrigen subiendo de
  versión**. Se mantiene Angular 18 y el punto se da por cerrado.
- **Análisis, aviso por aviso:** ninguna es explotable en este panel. Tres son de
  `HttpTransferCache`, que solo existe con SSR —y aquí no hay SSR ni hidratación—; una necesita
  URLs protocol-relative, que no se usan; y dos son DoS que exigen que el patrón de `formatDate` o
  `digitsInfo` lo controle un atacante, y esas funciones no se llaman en ningún sitio.
- **Por qué no se actualiza:** no hay versión corregida en 18.x ni 19.x. `npm audit fix --force`
  instala **Angular 21** y arrastra `@zxing/ngx-scanner` —el escáner de QR, que solo publica para
  Angular 21/22— y Angular Material, cuyo tema cambió a M3. Es una migración con riesgo real sobre
  un panel que funciona, para cerrar avisos que aquí no lo son.
- **Queda documentado en `DESPLIEGUE.md`**, en la sección del `npm audit`, que es donde aparecerá el
  rojo. Ahí están también los tres disparadores que obligarían a revisar la decisión: adoptar SSR,
  que aparezca un aviso que sí aplique, o que haya ventana para migrar con QA completo.
- **Sin cambios de código.** No se tocó ninguna dependencia.

### [2026-08-06]: Pantalla de inscritos de un evento

- **Alcance:**
  - `Modelo`: `src/app/core/models/registrant.model.ts` (nuevo) — `EventRegistrant`.
  - `Servicio`: `event.service.ts` — `getEventRegistrants()`, que consume
    `GET /api/events/{id}/registrations` (desplegado en producción hoy).
  - `Pantalla`: `src/app/features/admin/event-registrants/` (nueva), con ruta propia
    `admin/events/:id/registrations` en `app.routes.ts`.
  - `Acceso`: tercer botón en cada fila de "Administrar Eventos" (icono `group`, azul).
  - **Es pantalla y no diálogo**, a diferencia del feedback y la encuesta: la lista puede ser larga,
    se recorre buscando a alguien concreto y su URL se puede dejar abierta en la puerta del evento.
  - `Contadores`: inscritos, confirmados, **pendientes de pago**, asistieron y recaudado. El
    recaudado suma **solo las inscripciones confirmadas** — lo pendiente de pago no ha entrado en
    caja y sumarlo daría una cifra falsa.
  - `Buscador` por nombre, correo o teléfono, **filtrando en el cliente** porque el endpoint
    devuelve la lista entera y no acepta parámetros. Si algún día pagina, este es el punto a
    rehacer.
  - **El título del evento se pide aparte** (`getEventById`): el listado de inscritos no lo trae, y
    una pantalla que solo dijera "Inscritos" obliga a volver atrás para saber de cuál se habla.
  - El 403 lleva su propio mensaje, como en el diálogo de encuesta.
  - `ng build --configuration production` pasa.
- **Criterios de QA:**
  1. **El botón está:** cada fila de "Administrar Eventos" muestra ahora tres iconos de consulta —
     estrella (feedback), gráfico verde (encuesta) y grupo azul (inscritos).
  2. **La lista carga:** nombres y correos **legibles**, no en texto cifrado. Es lo que más fácil se
     rompe, porque el descifrado ocurre en el backend.
  3. **Los contadores cuadran:** confirmados + pendientes de pago = total de inscritos.
  4. **Recaudado:** una inscripción pendiente de pago **no** debe sumar al recaudado.
  5. **Buscador:** escribir parte de un nombre filtra la tabla y muestra "N de M"; un texto que no
     casa muestra "Ningún inscrito coincide", no una tabla vacía.
  6. **Evento sin inscritos:** mensaje "Todavía nadie se ha inscrito", sin contadores rotos.
  7. **Asistencia:** quien ya pasó por la puerta muestra el visto verde.
  8. **Recarga con F5** estando en la pantalla: debe seguir cargando (enrutado HTML5 de nginx).
  9. **Volver:** la flecha regresa a "Administrar Eventos".
  10. **Sin rol de administrador:** "Esta informacion es solo para administradores".

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
