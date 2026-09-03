import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { FilaImportacion, OpcionesImportacion, ResultadoImportacion } from '../models/importacion.model';

/**
 * Carga masiva de asistentes.
 *
 * Dos pasos, y el orden importa: **simular** no escribe nada y devuelve el
 * informe; **aplicar** solo crea cuentas si ese informe sale limpio. El botón de
 * confirmar de la pantalla se apoya en eso.
 */
@Injectable({
    providedIn: 'root'
})
export class ImportacionService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/importaciones/usuarios`;
    }

    /**
     * No escribe nada: cuenta cuántas cuentas se crearían, cuántas quedarían
     * inscritas y qué hay que corregir.
     */
    simular(filas: FilaImportacion[], opciones: OpcionesImportacion = {}): Observable<ResultadoImportacion> {
        return this.http.post<ResultadoImportacion>(`${this.apiUrl}?simular=true`, { filas, ...opciones });
    }

    /**
     * Crea las cuentas que faltan y, con `evento_id`, además inscribe. Si el
     * archivo trae problemas, no escribe nada.
     */
    aplicar(filas: FilaImportacion[], opciones: OpcionesImportacion = {}): Observable<ResultadoImportacion> {
        return this.http.post<ResultadoImportacion>(this.apiUrl, { filas, ...opciones });
    }
}
