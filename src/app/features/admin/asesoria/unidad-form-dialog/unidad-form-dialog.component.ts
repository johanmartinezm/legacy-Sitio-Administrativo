import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    AsesoriaUnidad,
    ICONOS_ASESORIA,
    MAX_SUBTITULO_UNIDAD,
    MAX_TITULO_UNIDAD,
    NECESIDADES_ASESORIA,
    iconoMaterial
} from '../../../../core/models/asesoria-unidad.model';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';
import { AsesoriaUnidadAdminService } from '../../../../core/services/asesoria_unidad_admin.service';

/** Datos del diálogo: la unidad a editar, o el orden que le toca a una nueva. */
export type DatosUnidadDialog = AsesoriaUnidad | { siguienteOrden: number };

@Component({
    selector: 'app-unidad-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatIconModule,
        ImageUploadComponent
    ],
    templateUrl: './unidad-form-dialog.component.html',
    styleUrls: ['./unidad-form-dialog.component.scss']
})
export class UnidadFormDialogComponent {
    readonly maxTitulo = MAX_TITULO_UNIDAD;
    readonly maxSubtitulo = MAX_SUBTITULO_UNIDAD;
    readonly necesidades = NECESIDADES_ASESORIA;
    readonly iconos = ICONOS_ASESORIA;
    readonly iconoMaterial = iconoMaterial;

    form: FormGroup;
    editando: AsesoriaUnidad | null;
    guardando = false;

    constructor(
        fb: FormBuilder,
        private unidadService: AsesoriaUnidadAdminService,
        private dialogRef: MatDialogRef<UnidadFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) data: DatosUnidadDialog
    ) {
        this.editando = 'titulo' in data ? data : null;
        const base = this.editando;
        this.form = fb.nonNullable.group({
            titulo: [base?.titulo ?? '', [Validators.required, Validators.maxLength(MAX_TITULO_UNIDAD)]],
            subtitulo: [base?.subtitulo ?? '', [Validators.maxLength(MAX_SUBTITULO_UNIDAD)]],
            icono: [base?.icono ?? 'negocio', Validators.required],
            imagen_url: [base?.imagen_url ?? ''],
            necesidad: [base?.necesidad ?? 'Gobierno', Validators.required],
            orden: [base?.orden ?? ('siguienteOrden' in data ? data.siguienteOrden : 10), Validators.required],
            activa: [base?.activa ?? true]
        });
    }

    guardar(): void {
        if (this.form.invalid || this.guardando) {
            this.form.markAllAsTouched();
            return;
        }
        this.guardando = true;
        const valor = this.form.getRawValue() as AsesoriaUnidad;
        const unidad: AsesoriaUnidad = {
            ...valor,
            titulo: valor.titulo.trim(),
            subtitulo: valor.subtitulo.trim(),
            imagen_url: (valor.imagen_url ?? '').trim(),
            orden: Number(valor.orden) || 0
        };
        const peticion = this.editando?.id
            ? this.unidadService.update(this.editando.id, unidad)
            : this.unidadService.create(unidad);

        peticion.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                // El backend responde texto plano en 400: se muestra tal cual.
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar la unidad';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
