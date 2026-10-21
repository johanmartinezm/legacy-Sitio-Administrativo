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
    auth.logout(true);
    return false;
};
