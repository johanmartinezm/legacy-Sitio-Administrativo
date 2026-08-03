import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

import { AdminUser } from '../models/admin-user.model';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin`;
    }

    /** Register a new admin user */
    registerAdmin(payload: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        role?: string;
    }): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, payload);
    }

    loginAdmin(email: string, password: string): Observable<{ token: string }> {
        return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(response => {
                localStorage.setItem('adminAuthToken', response.token);
            })
        );
    }

    /** Retrieve list of admin users (admin only) */
    listAdmins(): Observable<AdminUser[]> {
        return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
    }

    updateAdmin(id: string, admin: Partial<AdminUser>): Observable<AdminUser> {
        return this.http.put<AdminUser>(`${this.apiUrl}/users/${id}`, admin);
    }

    deleteAdmin(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
    }
}
