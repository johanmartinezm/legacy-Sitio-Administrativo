import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    Beneficio,
    MAX_DESCRIPCION_BENEFICIO,
    MAX_TITULO_BENEFICIO,
    TEXTOS_TIPO,
    TipoBeneficio
} from '../../../../core/models/beneficio.model';
import { BeneficioAdminService } from '../../../../core/services/beneficio_admin.service';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';

export interface DatosBeneficioDialog {
    beneficio: Beneficio | null;
    tipo: TipoBeneficio;
    siguienteOrden: number;
}

@Component({
    selector: 'app-beneficio-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        ImageUploadComponent
    ],
    templateUrl: './beneficio-form-dialog.component.html',
    styleUrls: ['./beneficio-form-dialog.component.scss']
})
export class BeneficioFormDialogComponent {
    readonly maxTitulo = MAX_TITULO_BENEFICIO;
    readonly maxDescripcion = MAX_DESCRIPCION_BENEFICIO;
    readonly textos;

    form: FormGroup;
    editando: Beneficio | null;
    guardando = false;

    constructor(
        fb: FormBuilder,
        private beneficioService: BeneficioAdminService,
        private dialogRef: MatDialogRef<BeneficioFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) private data: DatosBeneficioDialog
    ) {
        this.editando = data.beneficio;
        this.textos = TEXTOS_TIPO[data.tipo];
        const base = this.editando;
        this.form = fb.nonNullable.group({
            titulo: [base?.titulo ?? '', [Validators.required, Validators.maxLength(MAX_TITULO_BENEFICIO)]],
            descripcion: [base?.descripcion ?? '', [Validators.maxLength(MAX_DESCRIPCION_BENEFICIO)]],
            imagen_url: [base?.imagen_url ?? ''],
            enlace_url: [base?.enlace_url ?? '', [Validators.pattern(/^(https?:\/\/.+)?$/)]],
            orden: [base?.orden ?? data.siguienteOrden, Validators.required],
            activo: [base?.activo ?? true]
        });
    }

    guardar(): void {
        if (this.form.invalid || this.guardando) {
            this.form.markAllAsTouched();
            return;
        }
        this.guardando = true;
        const v = this.form.getRawValue();
        const beneficio: Beneficio = {
            tipo: this.data.tipo,
            titulo: v.titulo.trim(),
            descripcion: v.descripcion.trim(),
            imagen_url: (v.imagen_url ?? '').trim(),
            enlace_url: v.enlace_url.trim(),
            orden: Number(v.orden) || 0,
            activo: v.activo
        };
        const peticion = this.editando?.id
            ? this.beneficioService.update(this.editando.id, beneficio)
            : this.beneficioService.create(beneficio);

        peticion.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
