import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

    /**
     * La API habla snake_case y este modelo camelCase, asi que el nombre hay
     * que traducirlo en las dos direcciones.
     *
     * Sin esta traduccion el nombre **nunca se guardaba ni se mostraba**: el
     * panel enviaba `firstName`, el backend leia `first_name` (payload de
     * RegisterAdmin y `domain.AdminUser`) y escribia la cadena vacia. Los tres
     * administradores de produccion tenian nombre y apellido en blanco, y la
     * lista los pintaba vacios. `email` y `role` funcionaban por ser una sola
     * palabra, que es lo que ocultaba el fallo.
     */
    private aDto(admin: Partial<AdminUser>): any {
        return {
            email: admin.email,
            first_name: admin.firstName ?? '',
            last_name: admin.lastName ?? '',
            role: admin.role
        };
    }

    private desdeDto(dto: any): AdminUser {
        return {
            id: dto.id,
            email: dto.email,
            firstName: dto.first_name ?? '',
            lastName: dto.last_name ?? '',
            role: dto.role,
            createdAt: dto.created_at ? new Date(dto.created_at) : undefined,
            updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined
        };
    }

    /** Register a new admin user */
    registerAdmin(payload: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        role?: string;
    }): Observable<any> {
        // La contrasena va aparte: es el unico campo que no vive en el modelo.
        return this.http.post(`${this.apiUrl}/register`, {
            ...this.aDto(payload),
            password: payload.password
        });
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
        return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
            map(admins => admins.map(a => this.desdeDto(a)))
        );
    }

    updateAdmin(id: string, admin: Partial<AdminUser>): Observable<AdminUser> {
        return this.http.put<any>(`${this.apiUrl}/users/${id}`, this.aDto(admin)).pipe(
            map(a => this.desdeDto(a))
        );
    }

    deleteAdmin(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
    }
}
