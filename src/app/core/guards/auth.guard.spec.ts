import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';

/** JWT con el `exp` dado; la firma no importa aquí. */
function token(exp: number): string {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'HS256' })}.${b64({ sub: 'x', exp, role: 'admin' })}.firma`;
}

describe('authGuard', () => {
    let navegar: jasmine.Spy;
    const pasa = () => TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
        navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
        localStorage.removeItem('adminAuthToken');
    });

    afterEach(() => localStorage.removeItem('adminAuthToken'));

    it('deja pasar con un token vigente', () => {
        localStorage.setItem('adminAuthToken', token(Date.now() / 1000 + 3600));
        expect(pasa()).toBeTrue();
        expect(navegar).not.toHaveBeenCalled();
    });

    it('con un token vencido lo borra y avisa en el login', () => {
        localStorage.setItem('adminAuthToken', token(Date.now() / 1000 - 60));
        expect(pasa()).toBeFalse();
        expect(localStorage.getItem('adminAuthToken')).toBeNull();
        expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { sesion: 'vencida' } });
    });

    it('sin token va al login sin decir que la sesión venció', () => {
        expect(pasa()).toBeFalse();
        expect(navegar).toHaveBeenCalledWith(['/login'], {});
    });
});
