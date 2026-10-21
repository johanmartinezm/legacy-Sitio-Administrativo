import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('adminAuthToken');

    if (token) {
        const auth = inject(AuthService);
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        // Un 401 con token quiere decir que la sesión ya no vale (vencida o
        // firmada con otra clave): se cierra y se vuelve al login, en vez de
        // dejar la pantalla vacía. El login se excluye: ahí un 401 es una
        // contraseña equivocada.
        return next(cloned).pipe(
            catchError((err: unknown) => {
                if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.endsWith('/api/admin/login')) {
                    auth.logout(true);
                }
                return throwError(() => err);
            })
        );
    }

    return next(req);
};
