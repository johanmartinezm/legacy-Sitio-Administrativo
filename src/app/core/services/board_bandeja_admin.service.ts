import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from './config.service';
import { Pagina } from '../models/pagina';
import {
    CandidatoBoard,
    DetalleEnvioBoard,
    EstadoEnvioBoard,
    FiltroBandejaBoard,
    ResumenEnvioBoard
} from '../models/board-envio.model';

/**
 * Bandeja de Legacy Board: postulaciones y solicitudes, su detalle, los
 * cambios de estado y los correos que reciben el aviso de cada envío nuevo.
 */
@Injectable({
    providedIn: 'root'
})
export class BoardBandejaAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/board`;
    }

    /** El total llega en X-Total-Count y cuenta con los mismos filtros. */
    listar(filtro: FiltroBandejaBoard, limit: number, offset: number): Observable<Pagina<ResumenEnvioBoard>> {
        let params = new HttpParams()
            .set('formulario', filtro.formulario)
            .set('limit', limit)
            .set('offset', offset);
        for (const clave of ['estado', 'desde', 'hasta', 'filtro', 'opcion'] as const) {
            const valor = filtro[clave];
            if (valor) {
                params = params.set(clave, valor);
            }
        }
        return this.http.get<ResumenEnvioBoard[]>(`${this.apiUrl}/envios`, { observe: 'response', params }).pipe(
            map(res => {
                const items = res.body ?? [];
                const cabecera = Number(res.headers.get('X-Total-Count'));
                return { items, total: Number.isFinite(cabecera) && cabecera > 0 ? cabecera : items.length };
            })
        );
    }

    detalle(id: string): Observable<DetalleEnvioBoard> {
        return this.http.get<DetalleEnvioBoard>(`${this.apiUrl}/envios/${id}`);
    }

    /** Rechazar exige motivo; la persona no lo recibe, es nota del comité. */
    cambiarEstado(id: string, estado: Exclude<EstadoEnvioBoard, 'pendiente'>, motivo: string): Observable<DetalleEnvioBoard> {
        return this.http.put<DetalleEnvioBoard>(`${this.apiUrl}/envios/${id}/estado`, { estado, motivo });
    }

    /** Los consejeros que mejor encajan; solo para solicitudes aprobadas. */
    candidatos(id: string): Observable<CandidatoBoard[]> {
        return this.http.get<CandidatoBoard[]>(`${this.apiUrl}/envios/${id}/candidatos`);
    }

    destinatarios(): Observable<string[]> {
        return this.http.get<{ correos: string[] }>(`${this.apiUrl}/destinatarios`).pipe(map(r => r.correos ?? []));
    }

    /** Deja exactamente esa lista; el backend la devuelve normalizada. */
    guardarDestinatarios(correos: string[]): Observable<string[]> {
        return this.http.put<{ correos: string[] }>(`${this.apiUrl}/destinatarios`, { correos }).pipe(map(r => r.correos ?? []));
    }
}
