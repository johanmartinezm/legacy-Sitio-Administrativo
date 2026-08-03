import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

export interface CustomGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) { }

  private get adminUrl(): string {
    return `${this.config.apiUrl}/api/admin/groups`;
  }

  getGroups(): Observable<CustomGroup[]> {
    return this.http.get<CustomGroup[]>(this.adminUrl);
  }

  createGroup(name: string, description: string): Observable<CustomGroup> {
    return this.http.post<CustomGroup>(this.adminUrl, { name, description });
  }

  deleteGroup(id: string): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${id}`);
  }

  getMembers(groupId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.adminUrl}/${groupId}/members`);
  }

  replaceMembers(groupId: string, userIds: string[]): Observable<any> {
    return this.http.post(`${this.adminUrl}/${groupId}/members`, { user_ids: userIds });
  }
}
