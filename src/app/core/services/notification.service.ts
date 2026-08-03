import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface PushNotificationPayload {
  title: string;
  body: string;
  target_type: 'all' | 'group' | 'user';
  target_value?: string;
  data?: Record<string, string>;
}

export interface NotificationHistoryItem {
  id: string;
  admin_id?: string;
  title: string;
  body: string;
  target_type: string;
  target_value?: string;
  sent_at: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  private get adminUrl(): string {
    return `${this.config.apiUrl}/api/admin/notifications`;
  }

  send(payload: PushNotificationPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.adminUrl}/send`, payload);
  }

  getHistory(limit = 20, offset = 0): Observable<NotificationHistoryItem[]> {
    return this.http.get<NotificationHistoryItem[]>(`${this.adminUrl}/history`, {
      params: {
        limit: limit.toString(),
        offset: offset.toString()
      }
    });
  }
}
