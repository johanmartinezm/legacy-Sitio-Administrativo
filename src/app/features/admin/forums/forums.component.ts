import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ForumAdminService } from '../../../core/services/forum-admin.service';
import { Forum } from '../../../core/models/forum.model';

@Component({
  selector: 'app-forums',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.scss']
})
export class ForumsComponent implements OnInit {
  forums: Forum[] = [];
  // Desde el 2026-10-14 solo el panel crea foros: la app ya no puede.
  creando = false;
  guardando = false;
  nuevo = { title: '', description: '' };

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

  abrirFormulario() {
    this.nuevo = { title: '', description: '' };
    this.creando = true;
  }

  crearForo() {
    const title = this.nuevo.title.trim();
    if (!title) return;
    this.guardando = true;
    this.forumAdminService.createForum({ title, description: this.nuevo.description.trim() }).subscribe({
      next: () => {
        this.guardando = false;
        this.creando = false;
        this.loadForums();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error creating forum', err);
      }
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
