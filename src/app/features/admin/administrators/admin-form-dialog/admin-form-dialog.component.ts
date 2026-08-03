import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { AdminUser } from '../../../../core/models/admin-user.model';

@Component({
    selector: 'app-admin-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Administrador</h2>
    <mat-dialog-content>
      <form [formGroup]="adminForm" class="admin-form">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role">
            <mat-option value="admin">Administrador</mat-option>
            <mat-option value="superadmin">Super Administrador</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" *ngIf="!data">
          <mat-label>Contraseña</mat-label>
          <input matInput formControlName="password" type="password">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="adminForm.invalid" (click)="onSubmit()">
        {{ data ? 'Actualizar' : 'Registrar' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .admin-form { display: flex; flex-direction: column; gap: 10px; padding-top: 10px; }
    .row { display: flex; gap: 10px; }
    mat-form-field { width: 100%; }
  `]
})
export class AdminFormDialogComponent {
    adminForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<AdminFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: AdminUser | null
    ) {
        this.adminForm = this.fb.group({
            email: [data?.email || '', [Validators.required, Validators.email]],
            firstName: [data?.firstName || '', Validators.required],
            lastName: [data?.lastName || '', Validators.required],
            role: [data?.role || 'admin', Validators.required],
            password: ['', data ? [] : [Validators.required, Validators.minLength(6)]]
        });
    }

    onCancel() {
        this.dialogRef.close();
    }

    onSubmit() {
        if (this.adminForm.valid) {
            this.dialogRef.close(this.adminForm.value);
        }
    }
}
