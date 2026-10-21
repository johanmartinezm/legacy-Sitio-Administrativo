import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
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
