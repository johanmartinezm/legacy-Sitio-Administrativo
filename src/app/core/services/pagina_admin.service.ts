import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { PaginaInformativa } from '../models/pagina-informativa.model';

/**
 * Páginas de información de la app.
 *
 * Solo listar y guardar: el backend no expone crear ni borrar, porque cada
 * página tiene una pantalla en la app que la muestra.
 */
@Injectable({
    providedIn: 'root'
})
export class PaginaAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/paginas`;
    }

    listAll(): Observable<PaginaInformativa[]> {
        return this.http.get<PaginaInformativa[]>(this.apiUrl);
    }

    update(slug: string, pagina: PaginaInformativa): Observable<PaginaInformativa> {
        return this.http.put<PaginaInformativa>(`${this.apiUrl}/${slug}`, pagina);
    }
}
