import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { UserReport, UserReportStatus } from '../models/user-report.model';

/**
 * Bandeja de reportes de personas.
 *
 * La URL sale de ConfigService, como el resto de servicios: se resuelve en
 * tiempo de ejecución desde assets/config/config.json y no en el build.
 */
@Injectable({ providedIn: 'root' })
export class UserReportService {
  constructor(private http: HttpClient, private config: ConfigService) {}

  private get apiUrl(): string {
    return `${this.config.apiUrl}/api/admin/user-reports`;
  }

  /** Sin estado devuelve todos; el backend filtra cuando se le pasa uno. */
  getReports(status?: UserReportStatus): Observable<UserReport[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<UserReport[]>(this.apiUrl, { params });
  }

  resolveReport(id: string, status: UserReportStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}`, { status });
  }
}
