import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificationService, NotificationHistoryItem, PushNotificationPayload } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { GroupService, CustomGroup } from '../../../core/services/group.service';
import { User } from '../../../core/models/user.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-push-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.scss']
})
export class PushNotificationsComponent implements OnInit {
  notificationForm: FormGroup;
  history = signal<NotificationHistoryItem[]>([]);
  users = signal<User[]>([]);
  customGroups = signal<CustomGroup[]>([]);
  selectedUserIds = new Set<string>();
  
  searchTerm = '';
  selectedGroupId = '';
  isSending = signal<boolean>(false);
  sendingProgress = signal<number>(0);
  processedCount = signal<number>(0);
  totalCount = signal<number>(0);

  displayedColumns: string[] = ['sent_at', 'title', 'target_type', 'target_value', 'status'];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private userService: UserService,
    private groupService: GroupService,
    private snackBar: MatSnackBar
  ) {
    this.notificationForm = this.fb.group({
      title: ['', [Validators.required]],
      body: ['', [Validators.required]],
      target_type: ['all', [Validators.required]]
    });

    // Escuchar el tipo de audiencia para ajustar selecciones automáticamente
    this.notificationForm.get('target_type')?.valueChanges.subscribe(value => {
      this.selectedUserIds.clear();
      this.searchTerm = '';
      this.selectedGroupId = '';
      if (value === 'group' && this.customGroups().length > 0) {
        this.onGroupChange(this.customGroups()[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.loadHistory();
    this.loadUsers();
    this.loadCustomGroups();
  }

  loadHistory(): void {
    this.notificationService.getHistory(20, 0).subscribe({
      next: (data: NotificationHistoryItem[]) => this.history.set(data),
      error: () => this.snackBar.open('Error al cargar historial', 'Cerrar', { duration: 3000 })
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data: User[]) => this.users.set(data),
      error: () => this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 })
    });
  }

  loadCustomGroups(): void {
    this.groupService.getGroups().subscribe({
      next: (data: CustomGroup[]) => this.customGroups.set(data),
      error: () => this.snackBar.open('Error al cargar grupos personalizados', 'Cerrar', { duration: 3000 })
    });
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.toLowerCase().trim();
    let list = this.users();
    
    if (term) {
      list = list.filter(u => 
        (u.firstName && u.firstName.toLowerCase().includes(term)) ||
        (u.lastName && u.lastName.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      );
    }
    
    return list;
  }

  onGroupChange(groupId: string): void {
    this.selectedGroupId = groupId;
    this.selectedUserIds.clear();
    if (groupId) {
      this.groupService.getMembers(groupId).subscribe({
        next: (memberIds) => {
          memberIds.forEach(id => this.selectedUserIds.add(id));
        },
        error: () => this.snackBar.open('Error al cargar los miembros del grupo', 'Cerrar', { duration: 3000 })
      });
    }
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
  }

  toggleUserSelection(userId: string): void {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  toggleAllFiltered(checked: boolean): void {
    const filtered = this.filteredUsers;
    if (checked) {
      filtered.forEach(u => this.selectedUserIds.add(u.id));
    } else {
      filtered.forEach(u => this.selectedUserIds.delete(u.id));
    }
  }

  selectAllFiltered(): void {
    this.filteredUsers.forEach(u => this.selectedUserIds.add(u.id));
  }

  areAllFilteredSelected(): boolean {
    const filtered = this.filteredUsers;
    if (filtered.length === 0) return false;
    return filtered.every(u => this.selectedUserIds.has(u.id));
  }


  async onSubmit(): Promise<void> {
    if (this.notificationForm.invalid) return;

    const formVal = this.notificationForm.value;
    const targetType = formVal.target_type;

    if (targetType === 'all') {
      this.isSending.set(true);
      this.sendingProgress.set(50);
      const payload: PushNotificationPayload = {
        title: formVal.title,
        body: formVal.body,
        target_type: 'all',
        target_value: ''
      };
      this.notificationService.send(payload).subscribe({
        next: (res) => {
          this.isSending.set(false);
          this.snackBar.open(res.message || 'Notificación enviada a todos con éxito', 'Cerrar', { duration: 3000 });
          this.notificationForm.patchValue({ title: '', body: '' });
          this.loadHistory();
        },
        error: (err) => {
          this.isSending.set(false);
          const errMsg = err.error?.message || 'Error al despachar notificación';
          this.snackBar.open(errMsg, 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      const selectedIds = Array.from(this.selectedUserIds);
      if (selectedIds.length === 0) {
        this.snackBar.open('Debes seleccionar al menos un usuario destinatario', 'Cerrar', { duration: 3000 });
        return;
      }

      this.isSending.set(true);
      this.totalCount.set(selectedIds.length);
      this.processedCount.set(0);
      this.sendingProgress.set(0);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < selectedIds.length; i++) {
        const userId = selectedIds[i];
        try {
          const payload: PushNotificationPayload = {
            title: formVal.title,
            body: formVal.body,
            target_type: 'user',
            target_value: userId
          };
          await firstValueFrom(this.notificationService.send(payload));
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error al enviar notificación al usuario ${userId}:`, error);
        }
        
        this.processedCount.set(i + 1);
        const percent = Math.round(((i + 1) / selectedIds.length) * 100);
        this.sendingProgress.set(percent);
      }

      this.isSending.set(false);
      this.snackBar.open(
        `Despacho masivo finalizado. Éxito: ${successCount}, Errores: ${failCount}`,
        'Cerrar',
        { duration: 5000 }
      );
      this.notificationForm.patchValue({ title: '', body: '' });
      this.selectedUserIds.clear();
      this.loadHistory();
    }
  }
}

