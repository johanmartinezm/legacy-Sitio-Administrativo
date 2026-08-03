import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Event, Category } from '../models/event.model';
import { WorkshopRating } from '../models/rating.model';
import { ConfigService } from './config.service';

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
            speaker: dto.speaker || '',
            startDate: dto.date ? new Date(dto.date) : undefined,
            endDate: dto.end_date ? new Date(dto.end_date) : undefined,
            attendeesLimit: dto.attendees_limit,
            isFree: dto.isFree || false,
            actionStatus: dto.actionStatus || 'register',
            buttonText: dto.buttonText || '',
            includes: dto.includes || '',
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
