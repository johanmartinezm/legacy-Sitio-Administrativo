import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImageUploadService } from '../../services/image-upload.service';

/**
 * Campo de imagen: subir un archivo o pegar una URL.
 *
 * Se conserva la caja de texto a propósito. Los campos ya guardados contienen
 * URL escritas a mano y muchas apuntan a imágenes de la web corporativa que no
 * tiene sentido volver a subir; quitar la caja obligaría a rehacerlas todas.
 *
 * Implementa ControlValueAccessor para poder usarse con `formControlName`, igual
 * que el input al que sustituye.
 */
@Component({
    selector: 'app-image-upload',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ImageUploadComponent),
            multi: true
        }
    ],
    templateUrl: './image-upload.component.html',
    styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements ControlValueAccessor {
    @Input() label = 'Imagen';

    valor = '';
    subiendo = false;
    error: string | null = null;
    deshabilitado = false;

    readonly tiposAceptados = ImageUploadService.TIPOS_ACEPTADOS;

    private alCambiar: (valor: string) => void = () => { };
    private alTocar: () => void = () => { };

    constructor(private servicio: ImageUploadService) { }

    writeValue(valor: string): void {
        this.valor = valor || '';
    }

    registerOnChange(fn: (valor: string) => void): void {
        this.alCambiar = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.alTocar = fn;
    }

    setDisabledState(deshabilitado: boolean): void {
        this.deshabilitado = deshabilitado;
    }

    /** La URL escrita a mano sigue siendo válida. */
    urlEditada(valor: string): void {
        this.valor = valor;
        this.error = null;
        this.alCambiar(valor);
    }

    seleccionar(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        // Se limpia el input para que elegir el mismo archivo otra vez —tras un
        // error, por ejemplo— vuelva a disparar el evento.
        input.value = '';

        const problema = this.servicio.validar(archivo);
        if (problema) {
            this.error = problema;
            return;
        }

        this.subiendo = true;
        this.error = null;

        this.servicio.subir(archivo).subscribe({
            next: url => {
                this.subiendo = false;
                this.valor = url;
                this.alCambiar(url);
                this.alTocar();
            },
            error: err => {
                this.subiendo = false;
                // El backend responde 401 cuando la sesión caducó y 400 cuando
                // el archivo no le sirve: decirlo evita el "algo salió mal".
                this.error = err?.status === 401
                    ? 'Tu sesión expiró. Vuelve a iniciar sesión e inténtalo de nuevo.'
                    : 'No se pudo subir la imagen. Inténtalo de nuevo.';
            }
        });
    }

    quitar(): void {
        this.valor = '';
        this.error = null;
        this.alCambiar('');
        this.alTocar();
    }
}
