import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaginaInformativa } from '../../../../core/models/pagina-informativa.model';
import { PaginaAdminService } from '../../../../core/services/pagina_admin.service';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';

@Component({
    selector: 'app-pagina-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatIconModule,
        ImageUploadComponent
    ],
    templateUrl: './pagina-form-dialog.component.html',
    styleUrls: ['./pagina-form-dialog.component.scss']
})
export class PaginaFormDialogComponent {
    paginaForm: FormGroup;
    guardando = false;

    /** El mismo tope que aplica el backend, para avisar antes de enviar. */
    static readonly MAX_CUERPO = 20000;

    constructor(
        private fb: FormBuilder,
        private paginaService: PaginaAdminService,
        private dialogRef: MatDialogRef<PaginaFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: PaginaInformativa
    ) {
        this.paginaForm = this.fb.group({
            titulo: [data.titulo, [Validators.required]],
            subtitulo: [data.subtitulo || ''],
            imagen_url: [data.imagen_url || ''],
            cuerpo: [data.cuerpo || '', [Validators.maxLength(PaginaFormDialogComponent.MAX_CUERPO)]],
            publicada: [data.publicada]
        });
    }

    get largoCuerpo(): number {
        return (this.paginaForm.get('cuerpo')?.value || '').length;
    }

    get maxCuerpo(): number {
        return PaginaFormDialogComponent.MAX_CUERPO;
    }

    onSubmit(): void {
        if (this.paginaForm.invalid || this.guardando) return;

        this.guardando = true;
        const pagina: PaginaInformativa = {
            ...this.data,
            ...this.paginaForm.value
        };

        this.paginaService.update(this.data.slug, pagina).subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                // El backend responde texto plano en 400 y 404. Mostrarlo tal
                // cual evita el "error al guardar" que no dice qué corregir.
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar la página';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
