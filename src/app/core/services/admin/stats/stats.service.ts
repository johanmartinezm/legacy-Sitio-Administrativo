import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../config.service';

export interface ArticleStat {
    article_id: string;
    title: string;
    views: number;
}

export interface UserStat {
    user_id: string;
    first_name: string;
    last_name: string;
    reads: number;
}

export interface PeriodStats {
    period: string;
    views: number;
}

export interface DashboardStats {
    top_articles: ArticleStat[];
    top_users: UserStat[];
    weekly_stats: PeriodStats[];
    monthly_stats: PeriodStats[];
    yearly_stats: PeriodStats[];
}

@Injectable({
    providedIn: 'root'
})
export class StatsService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/stats`;
    }

    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
    }
}
