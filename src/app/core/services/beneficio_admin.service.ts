import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Beneficio } from '../models/beneficio.model';

/** Beneficios y alianzas de la sección Beneficios de la app: CRUD completo. */
@Injectable({
    providedIn: 'root'
})
export class BeneficioAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/beneficios`;
    }

    /** Trae los dos tipos; cada página filtra el suyo. */
    listAll(): Observable<Beneficio[]> {
        return this.http.get<Beneficio[]>(this.apiUrl);
    }

    create(beneficio: Beneficio): Observable<Beneficio> {
        return this.http.post<Beneficio>(this.apiUrl, beneficio);
    }

    update(id: string, beneficio: Beneficio): Observable<Beneficio> {
        return this.http.put<Beneficio>(`${this.apiUrl}/${id}`, beneficio);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
