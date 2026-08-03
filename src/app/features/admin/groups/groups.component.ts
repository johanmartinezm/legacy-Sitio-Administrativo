import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GroupService, CustomGroup } from '../../../core/services/group.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
  ],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  // ── Campos del formulario de creación ─────────────────────────────────────
  // Se usan propiedades simples en lugar de ReactiveFormsModule para evitar
  // el conflicto entre la validación de Angular y los inputs HTML nativos.
  groupName = '';
  groupDescription = '';
  groupNameTouched = false;

  // ── Estado general del componente ─────────────────────────────────────────
  groups = signal<CustomGroup[]>([]);
  users = signal<User[]>([]);
  selectedGroup = signal<CustomGroup | null>(null);
  selectedUserIds = new Set<string>();
  searchTerm = '';
  isSavingMembers = signal<boolean>(false);
  // Confirmación inline de eliminación — reemplaza window.confirm() que Chrome bloquea
  pendingDeleteGroup = signal<CustomGroup | null>(null);

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadUsers();
  }

  // ── Handlers de input del formulario ──────────────────────────────────────

  onGroupNameInput(event: Event): void {
    this.groupName = (event.target as HTMLInputElement).value;
    this.groupNameTouched = true;
  }

  onGroupDescriptionInput(event: Event): void {
    this.groupDescription = (event.target as HTMLTextAreaElement).value;
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  loadGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (data) => {
        const safeData = data ?? []; // Protección: backend Go puede devolver null en lugar de []
        this.groups.set(safeData);
        if (safeData.length > 0 && !this.selectedGroup()) {
          this.selectGroup(safeData[0]);
        }
      },
      error: () => this.snackBar.open('Error al cargar grupos', 'Cerrar', { duration: 3000 })
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: () => this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 })
    });
  }

  // ── Selección de grupo ────────────────────────────────────────────────────

  selectGroup(group: CustomGroup): void {
    this.selectedGroup.set(group);
    this.selectedUserIds.clear();
    this.groupService.getMembers(group.id).subscribe({
      next: (memberIds) => {
        const safeIds = memberIds ?? []; // Protección: backend puede devolver null
        safeIds.forEach(id => this.selectedUserIds.add(id));
      },
      error: () => this.snackBar.open('Error al cargar miembros del grupo', 'Cerrar', { duration: 3000 })
    });
  }

  // ── Filtro de usuarios ────────────────────────────────────────────────────

  get filteredUsers(): User[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.users();
    return this.users().filter(u =>
      (u.firstName && u.firstName.toLowerCase().includes(term)) ||
      (u.lastName && u.lastName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  }

  // ── Manejo de membresía ───────────────────────────────────────────────────

  isUserInGroup(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  toggleUserInGroup(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  toggleAllFiltered(checked: boolean): void {
    const filtered = this.filteredUsers;
    if (checked) {
      filtered.forEach(u => this.selectedUserIds.add(u.id));
    } else {
      filtered.forEach(u => this.selectedUserIds.delete(u.id));
    }
  }

  areAllFilteredSelected(): boolean {
    const filtered = this.filteredUsers;
    if (filtered.length === 0) return false;
    return filtered.every(u => this.selectedUserIds.has(u.id));
  }

  // ── Acciones CRUD de grupos ───────────────────────────────────────────────

  onCreateGroup(): void {
    const nameValue = this.groupName.trim();
    if (!nameValue) {
      this.groupNameTouched = true;
      this.snackBar.open('El nombre del grupo es requerido', 'Cerrar', { duration: 3000 });
      return;
    }

    this.groupService.createGroup(nameValue, this.groupDescription.trim()).subscribe({
      next: (newGroup) => {
        this.snackBar.open('Grupo creado con éxito', 'Cerrar', { duration: 3000 });
        // Resetear el formulario
        this.groupName = '';
        this.groupDescription = '';
        this.groupNameTouched = false;
        this.loadGroups();
        this.selectGroup(newGroup);
      },
      error: (err) => {
        // Mostrar el error exacto del backend
        const serverMsg = err.error?.message || err.error || null;
        const httpStatus = err.status ? ` (HTTP ${err.status})` : '';
        const errMsg = serverMsg
          ? String(serverMsg)
          : `Error al crear el grupo${httpStatus}`;
        this.snackBar.open(errMsg, 'Cerrar', { duration: 5000 });
        console.error('[GroupsComponent] Error al crear grupo:', err);
      }
    });
  }

  // Solicita confirmación antes de eliminar — evita usar window.confirm() que Chrome bloquea
  onRequestDeleteGroup(group: CustomGroup): void {
    this.pendingDeleteGroup.set(group);
  }

  onCancelDelete(): void {
    this.pendingDeleteGroup.set(null);
  }

  onConfirmDelete(): void {
    const group = this.pendingDeleteGroup();
    if (!group) return;

    this.pendingDeleteGroup.set(null);
    this.groupService.deleteGroup(group.id).subscribe({
      next: () => {
        this.snackBar.open('Grupo eliminado', 'Cerrar', { duration: 3000 });
        this.selectedGroup.set(null);
        this.loadGroups();
      },
      error: () => this.snackBar.open('Error al eliminar el grupo', 'Cerrar', { duration: 3000 })
    });
  }

  onSaveMembers(): void {
    const group = this.selectedGroup();
    if (!group) return;

    this.isSavingMembers.set(true);
    const userIds = Array.from(this.selectedUserIds);

    this.groupService.replaceMembers(group.id, userIds).subscribe({
      next: () => {
        this.isSavingMembers.set(false);
        this.snackBar.open('Miembros del grupo actualizados con éxito', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.isSavingMembers.set(false);
        this.snackBar.open('Error al guardar los miembros', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
