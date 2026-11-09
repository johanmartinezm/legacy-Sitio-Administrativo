import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protege todo lo que cuelga del layout principal. Hasta el 2026-10-21 no había
 * guard: cualquiera podía abrir /admin/... y, con un token vencido, el panel se
 * mostraba entero pero vacío.
 */
export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    if (auth.sesionVigente()) {
        return true;
    }
    // El aviso de sesión vencida solo si había un token: a quien nunca entró
    // no se le dice que su sesión venció.
    auth.logout(auth.getToken() !== null);
    return false;
};

/**
 * Una cuenta de rol `eventos` solo entra a las rutas marcadas con
 * `data: { eventos: true }`: inicio, la lista de eventos, sus inscritos y el
 * escáner de asistencia. En cualquier otra se la lleva a la lista de eventos.
 * Es comodidad, no seguridad: el backend le responde 403 a todo lo demás.
 */
export const rolGuard: CanActivateChildFn = (route) => {
    const auth = inject(AuthService);
    if (!auth.esSoloEventos() || route.data?.['eventos'] === true) {
        return true;
    }
    return inject(Router).createUrlTree(['/admin/events']);
};
