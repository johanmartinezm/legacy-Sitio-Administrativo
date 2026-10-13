import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SeccionInicio } from '../../../../core/models/seccion-inicio.model';
import { SeccionInicioAdminService } from '../../../../core/services/seccion_inicio_admin.service';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';

@Component({
    selector: 'app-seccion-inicio-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        ImageUploadComponent
    ],
    templateUrl: './seccion-inicio-dialog.component.html',
    styleUrls: ['./seccion-inicio-dialog.component.scss']
})
export class SeccionInicioDialogComponent {
    imagen: FormControl<string>;
    guardando = false;

    constructor(
        private seccionService: SeccionInicioAdminService,
        private dialogRef: MatDialogRef<SeccionInicioDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: SeccionInicio
    ) {
        this.imagen = new FormControl(data.imagen_url || '', { nonNullable: true });
    }

    guardar(): void {
        this.enviar(this.imagen.value.trim());
    }

    quitar(): void {
        this.enviar('');
    }

    private enviar(imagenUrl: string): void {
        if (this.guardando) return;
        this.guardando = true;

        this.seccionService.cambiarImagen(this.data.slug, imagenUrl).subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                // El backend responde texto plano en 400 y 404: se muestra tal
                // cual para que diga qué corregir.
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar la imagen';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
