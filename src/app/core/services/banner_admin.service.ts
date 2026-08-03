import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Banner } from '../models/banner.model';

@Injectable({
    providedIn: 'root'
})
export class BannerAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/banners`;
    }

    listAll(): Observable<Banner[]> {
        return this.http.get<Banner[]>(this.apiUrl);
    }

    create(banner: Banner): Observable<Banner> {
        return this.http.post<Banner>(this.apiUrl, banner);
    }

    update(id: string, banner: Banner): Observable<Banner> {
        return this.http.put<Banner>(`${this.apiUrl}/${id}`, banner);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
