import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, switchMap } from 'rxjs';
import { Event, Category } from '../models/event.model';
import { WorkshopRating } from '../models/rating.model';
import { EventSurveySummary } from '../models/survey.model';
import { EventRegistrant } from '../models/registrant.model';
import { ConfigService } from './config.service';
import { Pagina, LIMITE_MAXIMO_DE_PAGINA } from '../models/pagina';

@Injectable({
    providedIn: 'root'
})
export class EventService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/events`;
    }

    private get categoriesUrl(): string {
        return `${this.config.apiUrl}/api/categories`;
    }

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(this.categoriesUrl);
    }

    getEvents(): Observable<Event[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            map(events => events.map(e => this.mapDtoToEvent(e)))
        );
    }

    getEventById(id: string): Observable<Event> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(e => this.mapDtoToEvent(e))
        );
    }

    createEvent(event: Event): Observable<Event> {
        const dto = this.mapEventToDto(event);
        return this.http.post<any>(this.apiUrl, dto).pipe(
            map(e => this.mapDtoToEvent(e))
        );
    }

    updateEvent(event: Event): Observable<Event> {
        const dto = this.mapEventToDto(event);
        return this.http.put<any>(`${this.apiUrl}/${event.id}`, dto).pipe(
            map(e => this.mapDtoToEvent(e))
        );
    }

    /**
     * Oculta un evento de la app o lo vuelve a mostrar.
     *
     * Va por su propia ruta y no por updateEvent() a proposito: el PUT del
     * evento **no** escribe `status`, porque este formulario no lo envia y
     * meterlo alli lo dejaria vacio en cada guardado; como la app lista solo
     * los `active`, el evento desapareceria al editarlo. Hasta el 2026-08-26 no
     * habia forma de reactivar un evento desde el panel: solo por SQL.
     */
    updateStatus(id: string, status: 'active' | 'inactive'): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/status`, { status });
    }

    deleteEvent(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getEventFeedback(eventId: string): Observable<WorkshopRating[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${eventId}/feedback`).pipe(
            map(ratings => ratings.map(r => ({
                ...r,
                createdAt: new Date(r.createdAt)
            })))
        );
    }

    /**
     * Inscritos de un evento. Ruta AdminOnly: con un token que no sea de
     * administrador responde 403.
     *
     * Pagina desde el 2026-08-26. El total llega en `X-Total-Count`, no en el
     * cuerpo, porque la respuesta sigue siendo un array plano.
     *
     * **El orden lo manda el servidor** (fecha de inscripción descendente) y no
     * se reordena aquí: los nombres están cifrados en la base, así que un orden
     * alfabético solo puede hacerse sobre las filas ya traídas, y con páginas
     * eso da una lista que vuelve a empezar en cada página.
     */
    getEventRegistrants(eventId: string, limit: number, offset: number): Observable<Pagina<EventRegistrant>> {
        return this.http.get<any[]>(`${this.apiUrl}/${eventId}/registrations`, {
            observe: 'response',
            params: { limit, offset }
        }).pipe(
            map(res => {
                const items = (res.body ?? []).map(r => ({
                    ...r,
                    registrationDate: new Date(r.registrationDate)
                }));
                const cabecera = Number(res.headers.get('X-Total-Count'));
                return { items, total: Number.isFinite(cabecera) && cabecera > 0 ? cabecera : items.length };
            })
        );
    }

    /**
     * **Todos** los inscritos de un evento, recorriendo páginas por dentro.
     *
     * La pantalla de inscritos no puede trabajar con una página suelta y no es
     * capricho: busca por nombre, correo y teléfono —y esos campos están
     * cifrados en la base, así que el servidor no puede buscarlos—, y además
     * calcula los totales de confirmados, pendientes, asistencia y **lo
     * recaudado**. Con una página, esa cifra de dinero mostraría una fracción
     * del total sin avisar de nada, que es peor que no mostrarla.
     *
     * Lo que sí se gana paginando por dentro: ninguna consulta pide más de 200
     * filas, y el backend descifra como mucho esas 200 de golpe.
     *
     * El día que un evento tenga miles de inscritos, la salida no es subir el
     * techo sino que el servidor devuelva los totales ya calculados y que la
     * búsqueda se haga contra él, con una columna auxiliar al estilo del
     * `email_blind_index`.
     */
    getAllEventRegistrants(eventId: string): Observable<EventRegistrant[]> {
        return this.recorrerInscritos(eventId, 0, []);
    }

    private recorrerInscritos(eventId: string, offset: number, acumulado: EventRegistrant[]): Observable<EventRegistrant[]> {
        return this.getEventRegistrants(eventId, LIMITE_MAXIMO_DE_PAGINA, offset).pipe(
            switchMap(pagina => {
                const todo = acumulado.concat(pagina.items);
                // Se para también con una página vacía: sin esa guarda, un total
                // mal calculado dejaría el bucle pidiendo páginas para siempre.
                if (pagina.items.length === 0 || todo.length >= pagina.total) {
                    return of(todo);
                }
                return this.recorrerInscritos(eventId, offset + LIMITE_MAXIMO_DE_PAGINA, todo);
            })
        );
    }

    /**
     * Resumen de la encuesta general del evento. La ruta está bajo AdminOnly en
     * el backend, así que sale 403 con un token que no sea de administrador.
     *
     * Los promedios llegan como null cuando nadie respondió esa pregunta y se
     * dejan tal cual: convertirlos a 0 los mostraría como la peor nota posible.
     */
    getEventSurveySummary(eventId: string): Observable<EventSurveySummary> {
        return this.http.get<any>(`${this.apiUrl}/${eventId}/survey/summary`).pipe(
            map(s => ({
                ...s,
                comments: (s.comments ?? []).map((c: any) => ({
                    ...c,
                    createdAt: new Date(c.createdAt)
                }))
            }))
        );
    }

    checkIn(qrData: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/check-in`, { qrData });
    }

    private mapDtoToEvent(dto: any): Event {
        return {
            id: dto.id,
            title: dto.title,
            description: dto.description || '',
            imageUrl: dto.imageUrl || '',
            category: dto.category || '',
            categoryId: dto.category_id || '',
            price: dto.price || 0,
            location: dto.location || '',
            // Sin estos dos, abrir un evento virtual a editar pintaba la
            // casilla desmarcada y el enlace vacio: el formulario los pedia a
            // este mapeo y aqui no estaban.
            isVirtual: dto.isVirtual ?? false,
            accessUrl: dto.accessUrl ?? null,
            speaker: dto.speaker || '',
            startDate: dto.date ? new Date(dto.date) : undefined,
            endDate: dto.end_date ? new Date(dto.end_date) : undefined,
            attendeesLimit: dto.attendees_limit,
            isFree: dto.isFree || false,
            actionStatus: dto.actionStatus || 'register',
            buttonText: dto.buttonText || '',
            includes: dto.includes || '',
            status: dto.status || 'active',
            workshops: dto.workshops ? dto.workshops.map((w: any) => ({
                id: w.id,
                name: w.name,
                description: w.description,
                room: w.room,
                speaker: w.speaker,
                imageUrl: w.imageUrl,
                startDateTime: new Date(w.startDateTime),
                endDateTime: new Date(w.endDateTime)
            })) : []
        };
    }

    private mapEventToDto(event: Event): any {
        return {
            title: event.title,
            description: event.description,
            imageUrl: event.imageUrl,
            category: event.category,
            category_id: event.categoryId,
            price: event.price,
            location: event.location,
            // El PUT del backend escribe is_virtual y access_url siempre. Como
            // este mapeo no los enviaba, cada guardado desde el panel dejaba
            // is_virtual en false y borraba el enlace de la sesion: una
            // masterclass virtual se convertia en presencial al editarla, y
            // quien se inscribiera despues recibia QR en vez del enlace.
            // El dialogo ya se encarga de que un presencial llegue con
            // accessUrl a null.
            isVirtual: !!event.isVirtual,
            accessUrl: event.accessUrl ?? null,
            speaker: event.speaker,
            date: event.startDate?.toISOString(),
            end_date: event.endDate?.toISOString(),
            isFree: event.isFree,
            attendees_limit: event.attendeesLimit,
            actionStatus: event.actionStatus,
            buttonText: event.buttonText,
            includes: event.includes,
            workshops: event.workshops.map(w => ({
                name: w.name,
                description: w.description,
                room: w.room,
                speaker: w.speaker,
                imageUrl: w.imageUrl,
                startDateTime: w.startDateTime.toISOString(),
                endDateTime: w.endDateTime.toISOString()
            }))
        };
    }
}
