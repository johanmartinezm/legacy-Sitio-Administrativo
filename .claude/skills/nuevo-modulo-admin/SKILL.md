---
name: nuevo-modulo-admin
description: Genera un módulo CRUD del panel administrativo siguiendo el patrón que ya repite el proyecto (lista + diálogo de formulario + servicio + modelo + ruta). Usar al añadir cualquier sección nueva de administración.
---

# Añadir un módulo al panel administrativo

El proyecto repite el mismo patrón CRUD al menos cuatro veces (banners, contenido, administradores,
usuarios). Reproducirlo mantiene el panel coherente y evita reinventar decisiones ya tomadas.

## Estructura a generar

Para una entidad `X`:

```
src/app/core/models/x.model.ts
src/app/core/services/x_admin.service.ts
src/app/features/admin/x/
    x-list/x-list.component.{ts,html,scss}
    x-form-dialog/x-form-dialog.component.{ts,html,scss}
```

Más la ruta en `src/app/app.routes.ts`.

Toma `features/admin/banners/` como referencia: es el ejemplo más pequeño y completo.

## El servicio

Sigue exactamente el patrón de `core/services/banner_admin.service.ts`:

```typescript
@Injectable({ providedIn: 'root' })
export class XAdminService {
    constructor(private http: HttpClient, private config: ConfigService) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/x`;
    }

    listAll(): Observable<X[]> { return this.http.get<X[]>(this.apiUrl); }
    create(x: X): Observable<X> { return this.http.post<X>(this.apiUrl, x); }
    // update, delete...
}
```

Puntos que no hay que cambiar:

- La URL base sale de `ConfigService`, nunca escrita a mano.
- **No añadas la cabecera `Authorization`.** `core/interceptors/auth.interceptor.ts` la inyecta
  automáticamente leyendo `adminAuthToken` de `localStorage`.
- Las rutas administrativas del backend cuelgan de `/api/admin/...` y están protegidas por
  `AdminOnly`.

## Componentes

Componentes standalone (el proyecto no usa NgModules), Angular Material para tabla y diálogo. El
listado abre el diálogo de formulario con `MatDialog` y recarga al cerrarse.

## Verificar la ruta contra el backend

Antes de dar por terminado, confirma que el endpoint existe realmente:

```bash
grep -n "api/admin/x" ../Backend/cmd/server/main.go
```

Ya hay un caso de desalineación en el proyecto: `core/services/auth.service.ts:58` llama a
`/api/verify-email` y el backend expone `/verify-email`, así que la verificación de correo desde el
panel devuelve 404. No añadas otro.

Si el backend aún no tiene el endpoint, créalo primero con la skill `nuevo-endpoint` de
`legacy-Backend`.

## Trampas conocidas del proyecto

**El build de producción apunta a `localhost:8080`.** Solo existe `src/environments/environment.ts`
y `angular.json` no declara `fileReplacements`. Si vas a desplegar, hay que crear
`environment.prod.ts` y registrar su reemplazo, o el sitio publicado no encontrará la API.

**No hay subida de archivos en todo el panel.** Los campos de imagen son texto donde se pega una
URL, porque el `ImageHandler` del backend existe pero nunca se registró en el router. Si tu módulo
necesita imágenes, resuelve primero ese registro.

**Los permisos son binarios.** `core.admin_users.role` admite un único valor: o el usuario es
administrador y puede todo, o no entra. No existe granularidad por módulo.

## Antes de cerrar

```bash
ng build --configuration production
npm audit --omit=dev
```

Y valida el flujo real en el navegador con el entorno levantado (`.\levantar.ps1`), registrando el
resultado en `qa_bitacora.md` con el formato del proyecto: fecha, **Alcance** con los archivos
tocados, y **Criterios de QA** numerados y verificables.
