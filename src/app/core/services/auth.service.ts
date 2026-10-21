import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ConfigService } from './config.service';
import { tokenVigente } from '../utils/sesion';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private tokenKey = 'adminAuthToken';
    isLoggedIn = signal<boolean>(tokenVigente(localStorage.getItem(this.tokenKey)));

    constructor(
        private http: HttpClient,
        private router: Router,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin`;
    }

    login(credentials: { email: string, password: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                if (response.token) {
                    localStorage.setItem(this.tokenKey, response.token);
                    this.isLoggedIn.set(true);
                }
            })
        );
    }

    /** `vencida` muestra en el login el aviso de que la sesión caducó. */
    logout(vencida = false) {
        localStorage.removeItem(this.tokenKey);
        this.isLoggedIn.set(false);
        this.router.navigate(['/login'], vencida ? { queryParams: { sesion: 'vencida' } } : {});
    }

    /** Hay token y no ha pasado su `exp` (el backend lo firma por 24 horas). */
    sesionVigente(): boolean {
        return tokenVigente(localStorage.getItem(this.tokenKey));
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/forgot-password`, { email });
    }

    /**
     * El correo ya no se manda: el backend lo resuelve desde el token. Iba
     * también en la URL del enlace del correo, de donde se filtraba al
     * historial, a la cabecera Referer y a los registros de los proxies.
     */
    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/reset-password`, {
            token,
            new_password: newPassword
        });
    }

    verifyEmail(token: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/api/verify-email`, { token });
    }
}
