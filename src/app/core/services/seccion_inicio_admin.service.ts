import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { SeccionInicio } from '../models/seccion-inicio.model';

/**
 * Imágenes de las tarjetas del Inicio de la app.
 *
 * Solo listar y cambiar la imagen: las secciones las define la app, así que el
 * backend no expone crear ni borrar.
 */
@Injectable({
    providedIn: 'root'
})
export class SeccionInicioAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/inicio/secciones`;
    }

    listAll(): Observable<SeccionInicio[]> {
        return this.http.get<SeccionInicio[]>(this.apiUrl);
    }

    /** Cadena vacía quita la imagen. */
    cambiarImagen(slug: string, imagenUrl: string): Observable<SeccionInicio> {
        return this.http.put<SeccionInicio>(`${this.apiUrl}/${slug}`, { imagen_url: imagenUrl });
    }
}
