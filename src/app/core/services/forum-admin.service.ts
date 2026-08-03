import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';
import { Forum, ForumPost } from '../models/forum.model';

@Injectable({
  providedIn: 'root'
})
export class ForumAdminService {

  constructor(private http: HttpClient, private config: ConfigService) {}

  private get apiUrl(): string {
      return `${this.config.apiUrl}/api/admin/forums`;
  }

  getForums(): Observable<Forum[]> {
    return this.http.get<Forum[]>(this.apiUrl);
  }



  createForum(forum: Partial<Forum>): Observable<Forum> {
    return this.http.post<Forum>(this.apiUrl, forum);
  }

  updateForum(id: string, forum: Partial<Forum>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, forum);
  }

  lockForum(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/lock`, {});
  }

  unlockForum(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/unlock`, {});
  }

  deleteForum(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFlaggedPosts(): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(`${this.apiUrl}/flagged`);
  }

  getForumTree(forumId: string): Observable<ForumPost[]> {
    return this.http.get<ForumPost[]>(`${this.apiUrl}/${forumId}/posts`);
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }
}
