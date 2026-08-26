import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from './config.service';
import { EstadoContacto, MensajeDeContacto } from '../models/contacto.model';
import { Pagina } from '../models/pagina';

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

  /**
   * Una página de la bandeja. Sin estado trae todos; el backend filtra cuando
   * se le pasa uno.
   *
   * El total llega en `X-Total-Count` y **cuenta con el mismo filtro de estado**
   * que el listado: si se contara sin filtrar, al mirar solo los pendientes el
   * paginador ofrecería páginas de mensajes que no están en pantalla.
   */
  listar(estado: EstadoContacto | undefined, limit: number, offset: number): Observable<Pagina<MensajeDeContacto>> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (estado) {
      params = params.set('estado', estado);
    }
    return this.http.get<MensajeDeContacto[]>(this.apiUrl, { observe: 'response', params }).pipe(
      map(res => {
        const items = res.body ?? [];
        const cabecera = Number(res.headers.get('X-Total-Count'));
        return { items, total: Number.isFinite(cabecera) && cabecera > 0 ? cabecera : items.length };
      })
    );
  }

  cambiarEstado(id: string, estado: EstadoContacto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, { estado });
  }
}
