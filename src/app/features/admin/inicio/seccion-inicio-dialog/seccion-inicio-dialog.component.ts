import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    CambiosSeccionInicio,
    MAX_TEXTO_SECCION,
    MAX_TITULO_SECCION,
    SeccionInicio,
    TEXTOS_POR_DEFECTO,
    camposDe
} from '../../../../core/models/seccion-inicio.model';
import { SeccionInicioAdminService } from '../../../../core/services/seccion_inicio_admin.service';
import { ImageUploadComponent } from '../../../../core/components/image-upload/image-upload.component';

/** Tarjetas del Inicio que la app pinta en la cuadrícula de dos columnas. */
const TARJETAS_EN_CUADRICULA = new Set([
    'legacy-knowledge', 'eventos', 'lso-escuela', 'asesorias', 'diagnosticos', 'contactenos'
]);

@Component({
    selector: 'app-seccion-inicio-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        ImageUploadComponent
    ],
    templateUrl: './seccion-inicio-dialog.component.html',
    styleUrls: ['./seccion-inicio-dialog.component.scss']
})
export class SeccionInicioDialogComponent {
    readonly maxTitulo = MAX_TITULO_SECCION;
    readonly maxTexto = MAX_TEXTO_SECCION;

    imagen: FormControl<string>;
    titulo: FormControl<string>;
    texto: FormControl<string>;
    /** Lo que muestra la app si el campo se deja vacío. */
    porDefecto: { titulo: string; texto: string };
    guardando = false;

    constructor(
        private seccionService: SeccionInicioAdminService,
        private dialogRef: MatDialogRef<SeccionInicioDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: SeccionInicio
    ) {
        this.imagen = new FormControl(data.imagen_url || '', { nonNullable: true });
        this.titulo = new FormControl(data.titulo || '', {
            nonNullable: true,
            validators: [Validators.maxLength(MAX_TITULO_SECCION)]
        });
        this.texto = new FormControl(data.texto || '', {
            nonNullable: true,
            validators: [Validators.maxLength(MAX_TEXTO_SECCION)]
        });
        this.porDefecto = TEXTOS_POR_DEFECTO[data.slug] ?? { titulo: data.nombre, texto: '' };
    }

    /** Qué campos lleva la fila según su pantalla (CAMPOS_POR_PANTALLA). */
    get conImagen(): boolean {
        return camposDe(this.data).imagen;
    }

    /**
     * La imagen es fondo oscurecido bajo el texto. Las tarjetas de la cuadrícula
     * son casi cuadradas; el resto son filas de ancho completo y poca altura
     * (home_content_screen.dart).
     */
    get recomendacionImagen(): string {
        return TARJETAS_EN_CUADRICULA.has(this.data.slug)
            ? 'Cuadrada, 600 × 600 px. Va de fondo, oscurecida, con el título y el texto encima en la parte de abajo: sin texto en la imagen.'
            : 'Horizontal, 600 × 200 px (3:1). Va de fondo en una fila de poca altura, oscurecida y con el texto encima: deja el motivo en el centro y sin texto.';
    }

    get conTitulo(): boolean {
        return camposDe(this.data).titulo;
    }

    get conTexto(): boolean {
        return camposDe(this.data).texto;
    }

    /** Prefijo del encabezado del diálogo según la pantalla. */
    get prefijo(): string {
        if (this.conImagen) return 'Tarjeta';
        return this.data.pantalla === 'legacy-plus' ? 'Legacy+ ·' : 'LSO ·';
    }

    /** Lo que se verá en la app: lo escrito o, si está vacío, lo de siempre. */
    get tituloVisible(): string {
        return this.titulo.value.trim() || this.porDefecto.titulo;
    }

    get textoVisible(): string {
        return this.texto.value.trim() || this.porDefecto.texto;
    }

    get valido(): boolean {
        return this.titulo.valid && this.texto.valid;
    }

    guardar(): void {
        if (!this.valido) return;
        const cambios: CambiosSeccionInicio = {};
        if (this.conTexto) cambios.texto = this.texto.value.trim();
        if (this.conTitulo) cambios.titulo = this.titulo.value.trim();
        if (this.conImagen) cambios.imagen_url = this.imagen.value.trim();
        this.enviar(cambios);
    }

    /** Solo la imagen: el título y el texto guardados no se tocan. */
    quitarImagen(): void {
        this.enviar({ imagen_url: '' });
    }

    private enviar(cambios: CambiosSeccionInicio): void {
        if (this.guardando) return;
        this.guardando = true;

        this.seccionService.actualizar(this.data.slug, cambios).subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                // El backend responde texto plano en 400 y 404: se muestra tal
                // cual para que diga qué corregir.
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
