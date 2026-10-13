import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { LegacyPlusItem } from '../models/legacy-plus-item.model';

/** Puntos con check de la pantalla Legacy+ de la app: CRUD completo. */
@Injectable({
    providedIn: 'root'
})
export class LegacyPlusItemAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/legacy-plus/items`;
    }

    listAll(): Observable<LegacyPlusItem[]> {
        return this.http.get<LegacyPlusItem[]>(this.apiUrl);
    }

    create(item: LegacyPlusItem): Observable<LegacyPlusItem> {
        return this.http.post<LegacyPlusItem>(this.apiUrl, item);
    }

    update(id: string, item: LegacyPlusItem): Observable<LegacyPlusItem> {
        return this.http.put<LegacyPlusItem>(`${this.apiUrl}/${id}`, item);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
