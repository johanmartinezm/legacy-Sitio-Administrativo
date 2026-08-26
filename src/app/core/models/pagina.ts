/**
 * Una página de resultados y el total de filas que hay detrás.
 *
 * Los listados de la API responden un **array plano** y publican el total en la
 * cabecera `X-Total-Count`. No se envuelve la respuesta en `{items, total}` en
 * el servidor a propósito: hay clientes publicados —la app instalada en
 * teléfonos que no se actualizan solos— que recorren ese array directamente, y
 * cambiar la forma los rompería a todos a la vez.
 *
 * Este tipo es el equivalente ya montado del lado del panel.
 */
export interface Pagina<T> {
    items: T[];
    /** Filas totales, no las de esta página: es lo que necesita el paginador. */
    total: number;
}

/** Techo que aplica el backend a `?limit=`, se pida lo que se pida. */
export const LIMITE_MAXIMO_DE_PAGINA = 200;
