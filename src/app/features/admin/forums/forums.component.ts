import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
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
  // null: el formulario crea; con id: edita ese foro.
  editandoId: string | null = null;
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
    this.editandoId = null;
    this.nuevo = { title: '', description: '' };
    this.creando = true;
  }

  editarForo(forum: Forum) {
    this.editandoId = forum.id;
    this.nuevo = { title: forum.title, description: forum.description || '' };
    this.creando = true;
  }

  guardarForo() {
    const title = this.nuevo.title.trim();
    if (!title) return;
    const datos = { title, description: this.nuevo.description.trim() };
    // El PUT conserva estado y portada cuando no se envían.
    const peticion: Observable<unknown> = this.editandoId
      ? this.forumAdminService.updateForum(this.editandoId, datos)
      : this.forumAdminService.createForum(datos);
    this.guardando = true;
    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.creando = false;
        this.loadForums();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error saving forum', err);
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
