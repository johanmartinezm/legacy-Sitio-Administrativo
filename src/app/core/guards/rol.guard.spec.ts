import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { rolGuard } from './auth.guard';
import { rolDelToken } from '../utils/sesion';

/** JWT con el rol dado; la firma no importa aquí. */
function token(role?: string): string {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'HS256' })}.${b64({ sub: 'x', exp: Date.now() / 1000 + 3600, role })}.firma`;
}

describe('rol de la cuenta del panel', () => {
    it('solo «eventos» cuenta como eventos; lo demás, como admin', () => {
        expect(rolDelToken(token('eventos'))).toBe('eventos');
        expect(rolDelToken(token('admin'))).toBe('admin');
        // Tokens firmados antes del rol nuevo, o ilegibles: nadie pierde el panel.
        expect(rolDelToken(token())).toBe('admin');
        expect(rolDelToken('basura')).toBe('admin');
        expect(rolDelToken(null)).toBe('admin');
    });
});

describe('rolGuard', () => {
    const entrar = (data: object) => TestBed.runInInjectionContext(() =>
        rolGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
        localStorage.removeItem('adminAuthToken');
    });

    afterEach(() => localStorage.removeItem('adminAuthToken'));

    it('un administrador entra en todo', () => {
        localStorage.setItem('adminAuthToken', token('admin'));
        expect(entrar({})).toBeTrue();
        expect(entrar({ eventos: true })).toBeTrue();
    });

    it('la cuenta de eventos entra en lo marcado', () => {
        localStorage.setItem('adminAuthToken', token('eventos'));
        expect(entrar({ eventos: true })).toBeTrue();
    });

    it('la cuenta de eventos va a la lista de eventos desde cualquier otra ruta', () => {
        localStorage.setItem('adminAuthToken', token('eventos'));
        const destino = entrar({});
        expect(destino instanceof UrlTree).toBeTrue();
        expect(TestBed.inject(Router).serializeUrl(destino as UrlTree)).toBe('/admin/events');
    });
});
