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
    if (!token) {
        return false;
    }
    const partes = token.split('.');
    if (partes.length !== 3) {
        return false;
    }
    try {
        const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
        return typeof payload.exp === 'number' && payload.exp * 1000 > ahora;
    } catch {
        return false;
    }
}
