import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface ContentCategory {
    id?: string;
    name: string;
    slug: string;
    description?: string;
    icon_url?: string;
    is_active?: boolean;
}

export type ContentType = 'text' | 'video';

export interface CustomContent {
    id?: string;
    category_id?: string;
    type: ContentType;
    title: string;
    excerpt: string;
    body_text?: string;
    video_url?: string;
    thumbnail_url?: string;
    is_published: boolean;
    published_at?: string;
    category_name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContentAdminService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/content`;
    }

    // Categories
    getCategories(): Observable<ContentCategory[]> {
        return this.http.get<ContentCategory[]>(`${this.apiUrl}/categories`);
    }

    createCategory(category: ContentCategory): Observable<ContentCategory> {
        return this.http.post<ContentCategory>(`${this.apiUrl}/categories`, category);
    }

    updateCategory(id: string, category: ContentCategory): Observable<ContentCategory> {
        return this.http.put<ContentCategory>(`${this.apiUrl}/categories/${id}`, category);
    }

    deleteCategory(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
    }

    // Items
    getContentItems(category?: string): Observable<CustomContent[]> {
        const params: any = {};
        if (category) params.category = category;
        return this.http.get<CustomContent[]>(`${this.apiUrl}/items`, { params });
    }

    getContentItem(id: string): Observable<CustomContent> {
        return this.http.get<CustomContent>(`${this.apiUrl}/items/${id}`);
    }

    createContentItem(item: CustomContent): Observable<CustomContent> {
        return this.http.post<CustomContent>(`${this.apiUrl}/items`, item);
    }

    updateContentItem(id: string, item: CustomContent): Observable<CustomContent> {
        return this.http.put<CustomContent>(`${this.apiUrl}/items/${id}`, item);
    }

    deleteContentItem(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
    }
}
