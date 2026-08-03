import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private tokenKey = 'adminAuthToken';
    isLoggedIn = signal<boolean>(!!localStorage.getItem(this.tokenKey));

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

    logout() {
        localStorage.removeItem(this.tokenKey);
        this.isLoggedIn.set(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    forgotPassword(email: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/forgot-password`, { email });
    }

    resetPassword(email: string, token: string, newPassword: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/reset-password`, {
            email,
            token,
            new_password: newPassword
        });
    }

    verifyEmail(token: string): Observable<any> {
        return this.http.post(`${this.config.apiUrl}/api/verify-email`, { token });
    }
}
