import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { AsesoriaUnidad } from '../models/asesoria-unidad.model';

/** Unidades de la pantalla Asesoría de la app: CRUD completo. */
@Injectable({
    providedIn: 'root'
})
export class AsesoriaUnidadAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/asesoria/unidades`;
    }

    listAll(): Observable<AsesoriaUnidad[]> {
        return this.http.get<AsesoriaUnidad[]>(this.apiUrl);
    }

    create(unidad: AsesoriaUnidad): Observable<AsesoriaUnidad> {
        return this.http.post<AsesoriaUnidad>(this.apiUrl, unidad);
    }

    update(id: string, unidad: AsesoriaUnidad): Observable<AsesoriaUnidad> {
        return this.http.put<AsesoriaUnidad>(`${this.apiUrl}/${id}`, unidad);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
