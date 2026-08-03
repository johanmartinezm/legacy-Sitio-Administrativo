import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ForumAdminService } from '../../../core/services/forum-admin.service';
import { Forum } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forums',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.scss']
})
export class ForumsComponent implements OnInit {
  forums: Forum[] = [];

  constructor(private forumAdminService: ForumAdminService) {}

  ngOnInit(): void {
    this.loadForums();
  }

  loadForums() {
    this.forumAdminService.getForums().subscribe({
      next: (data) => this.forums = data,
      error: (err) => console.error('Error loading forums', err)
    });
  }

  toggleLock(forum: Forum) {
    if (forum.status === 'locked') {
      this.unlockForum(forum.id);
    } else {
      this.lockForum(forum.id);
    }
  }

  lockForum(id: string) {
    if(confirm('¿Estás seguro de bloquear este foro? Pasará a solo lectura.')) {
      this.forumAdminService.lockForum(id).subscribe({
        next: () => this.loadForums(),
        error: (err) => console.error(err)
      });
    }
  }

  unlockForum(id: string) {
    if(confirm('¿Estás seguro de desbloquear este foro? Se permitirán nuevos comentarios.')) {
      this.forumAdminService.unlockForum(id).subscribe({
        next: () => this.loadForums(),
        error: (err) => console.error(err)
      });
    }
  }

  deleteForum(id: string) {
    if(confirm('¿Estás seguro de eliminar este foro? Esta acción no se puede deshacer.')) {
      this.forumAdminService.deleteForum(id).subscribe({
        next: () => this.loadForums(),
        error: (err) => console.error(err)
      });
    }
  }
}
