import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { EstadoContacto, MensajeDeContacto } from '../models/contacto.model';

/**
 * Bandeja de mensajes de "Contáctenos".
 *
 * La URL sale de ConfigService, como el resto de servicios: se resuelve en
 * tiempo de ejecución desde assets/config/config.json y no en el build.
 */
@Injectable({ providedIn: 'root' })
export class ContactoService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  private get apiUrl(): string {
    return `${this.config.apiUrl}/api/admin/contacto`;
  }

  /** Sin estado devuelve todos; el backend filtra cuando se le pasa uno. */
  listar(estado?: EstadoContacto): Observable<MensajeDeContacto[]> {
    let params = new HttpParams();
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<MensajeDeContacto[]>(this.apiUrl, { params });
  }

  cambiarEstado(id: string, estado: EstadoContacto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, { estado });
  }
}
