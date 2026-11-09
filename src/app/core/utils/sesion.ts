/**
 * Dice si el token de administrador guardado sigue sirviendo.
 *
 * Existe porque el panel daba la sesión por iniciada con solo tener un token en
 * `localStorage`. El backend lo firma por 24 horas; pasado ese plazo, todas las
 * rutas de administración respondían 401 y las pantallas se quedaban vacías sin
 * avisar —la de Usuarios fue la que se notó, el 2026-10-21—, mientras las que
 * leen rutas públicas (eventos, categorías) seguían cargando.
 *
 * Solo lee el `exp` del payload: la firma la comprueba el backend, que es quien
 * decide. Un token ilegible o sin `exp` se da por vencido.
 */
export function tokenVigente(token: string | null, ahora: number = Date.now()): boolean {
    const payload = leerPayload(token);
    return typeof payload?.exp === 'number' && payload.exp * 1000 > ahora;
}

/**
 * Rol de la cuenta del panel, sacado del claim `role` del token: `admin` o
 * `eventos` —la de quien solo ve eventos e inscritos y valida asistencia—. Un
 * token antiguo o ilegible cuenta como `admin`, que es lo que el backend
 * firmaba siempre antes del 2026-11-09; quien decide de verdad es el backend,
 * que a una cuenta `eventos` le responde 403 en todo lo demás.
 */
export type RolPanel = 'admin' | 'eventos';

export function rolDelToken(token: string | null): RolPanel {
    return leerPayload(token)?.role === 'eventos' ? 'eventos' : 'admin';
}

function leerPayload(token: string | null): any | null {
    if (!token) {
        return null;
    }
    const partes = token.split('.');
    if (partes.length !== 3) {
        return null;
    }
    try {
        const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    } catch {
        return null;
    }
}
