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
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';
import { PAISES_LATAM, tiposConValorActual } from '../../../../core/utils/identificacion';

@Component({
    selector: 'app-user-form-dialog',
    standalone: true,
    imports: [
        ImageUploadComponent,
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

    readonly paises = PAISES_LATAM;

    /**
     * Tipos que ofrece el desplegable para el país elegido. Incluye el valor ya
     * guardado aunque no esté en el catálogo, para no vaciar el campo —ni
     * borrarlo al guardar— en las cuentas antiguas con `CC` o `CE`.
     */
    get tiposIdentificacion(): readonly string[] {
        return tiposConValorActual(
            this.userForm?.get('country')?.value,
            this.userForm?.get('identificationType')?.value,
        );
    }

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
            // Sin valor por defecto: el `CC` que había aquí no existe en el
            // catálogo de la app, así que toda cuenta creada desde el panel
            // nacía con un tipo que la app no sabe leer.
            identificationType: [data?.identificationType || ''],
            identificationNumber: [data?.identificationNumber || ''],
            customerStatus: [data?.customerStatus || 'Ya soy cliente'],
            isPublicProfile: [data?.isPublicProfile !== undefined ? data.isPublicProfile : true],
            allowMessagesFromStrangers: [data?.allowMessagesFromStrangers !== undefined ? data.allowMessagesFromStrangers : true],
            showActivity: [data?.showActivity !== undefined ? data.showActivity : true]
        });

        // Al cambiar de país, el tipo guardado casi nunca sigue valiendo —un RUC
        // peruano no existe en Colombia—. Se limpia para obligar a elegir de
        // nuevo, en vez de dejar una combinación que la app no reconocería.
        // `valueChanges` no dispara con el valor inicial, así que abrir a editar
        // no toca nada.
        this.userForm.get('country')!.valueChanges.subscribe((pais: string) => {
            const tipo = this.userForm.get('identificationType')!;
            if (tipo.value && !tiposConValorActual(pais, null).includes(tipo.value)) {
                tipo.setValue('');
            }
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
