import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { User } from '../../../../core/models/user.model';

@Component({
    selector: 'app-user-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule
    ],
    templateUrl: './user-form-dialog.component.html',
    styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent {
    userForm: FormGroup;
    isEditMode: boolean;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<UserFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: User | null
    ) {
        this.isEditMode = !!data;
        this.userForm = this.fb.group({
            firstName: [data?.firstName || '', Validators.required],
            lastName: [data?.lastName || '', Validators.required],
            birthDate: [data?.birthDate ? data.birthDate.split('T')[0] : ''],
            email: [data?.email || '', [Validators.required, Validators.email]],
            password: [''], // Only for creating new users or changing
            role: [data?.role || 'familia', Validators.required],
            phone: [data?.phone || ''],
            location: [data?.location || ''],
            bio: [data?.bio || ''],
            industry: [data?.industry || 'Servicios'],
            profileImageUrl: [data?.profileImageUrl || ''],
            generation: [data?.generation || 'Primera (Fundador)'],
            companyName: [data?.companyName || ''],
            jobTitle: [data?.jobTitle || ''],
            country: [data?.country || 'Colombia'],
            identificationType: [data?.identificationType || 'CC'],
            identificationNumber: [data?.identificationNumber || ''],
            customerStatus: [data?.customerStatus || 'Ya soy cliente'],
            isPublicProfile: [data?.isPublicProfile !== undefined ? data.isPublicProfile : true],
            allowMessagesFromStrangers: [data?.allowMessagesFromStrangers !== undefined ? data.allowMessagesFromStrangers : true],
            showActivity: [data?.showActivity !== undefined ? data.showActivity : true]
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.userForm.valid) {
            console.log('Guardando datos de usuario:', this.userForm.value);
            this.dialogRef.close(this.userForm.value);
        }
    }
}
