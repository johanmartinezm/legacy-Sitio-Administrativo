import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { CatalogoBoard, OpcionBoard } from '../models/board-opcion.model';

/**
 * Listas de los formularios de Legacy Board. Sin borrar: una opción que ya se
 * usó en un envío se desactiva (el backend no tiene DELETE).
 */
@Injectable({
    providedIn: 'root'
})
export class BoardOpcionAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/board`;
    }

    catalogos(): Observable<CatalogoBoard[]> {
        return this.http.get<CatalogoBoard[]>(`${this.apiUrl}/catalogos`);
    }

    /** Todas las opciones del catálogo, también las inactivas, ya ordenadas. */
    opciones(catalogo: string): Observable<OpcionBoard[]> {
        return this.http.get<OpcionBoard[]>(`${this.apiUrl}/opciones`, {
            params: new HttpParams().set('catalogo', catalogo)
        });
    }

    create(opcion: OpcionBoard): Observable<OpcionBoard> {
        return this.http.post<OpcionBoard>(`${this.apiUrl}/opciones`, opcion);
    }

    /** Cambia nombre, orden y si está activa; el catálogo y el código no cambian. */
    update(id: string, opcion: Pick<OpcionBoard, 'etiqueta' | 'orden' | 'activo'>): Observable<OpcionBoard> {
        return this.http.put<OpcionBoard>(`${this.apiUrl}/opciones/${id}`, opcion);
    }
}
