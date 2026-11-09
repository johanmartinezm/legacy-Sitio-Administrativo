import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ImageUploadComponent } from '../../../core/components/image-upload/image-upload.component';
import { EventService } from '../../../core/services/event.service';
import { MaterialDeWorkshop, Workshop } from '../../../core/models/event.model';

/** Lo que admite el servidor: PDF, Word, Excel, PowerPoint o ZIP. */
const EXTENSIONES = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip'];
const TAMANO_MAXIMO = 25 * 1024 * 1024;

/**
 * Comprueba en el panel lo mismo que el servidor (`workshops_material.go`):
 * https, YouTube o Vimeo, y que apunte a un video. Así el error sale antes de
 * guardar, y no como un 400.
 */
export function enlaceDeVideoValido(control: AbstractControl): ValidationErrors | null {
    const valor = (control.value ?? '').trim();
    if (!valor) return null;
    let u: URL;
    try {
        u = new URL(valor);
    } catch {
        return { video: 'No es una dirección válida.' };
    }
    if (u.protocol !== 'https:') return { video: 'Tiene que empezar por https://' };

    const host = u.hostname.toLowerCase();
    const partes = u.pathname.split('/').filter(Boolean);
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
        const ok = (host === 'youtu.be' && partes.length > 0) ||
            (partes[0] === 'watch' && !!u.searchParams.get('v')) ||
            (partes.length >= 2 && ['shorts', 'live', 'embed'].includes(partes[0]));
        return ok ? null : { video: 'El enlace de YouTube no apunta a un video.' };
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
        const ok = host === 'player.vimeo.com'
            ? partes[0] === 'video' && /^\d+$/.test(partes[1] ?? '')
            : /^\d+$/.test(partes[0] ?? '');
        return ok ? null : { video: 'El enlace de Vimeo no apunta a un video.' };
    }
    return { video: 'El video tiene que ser de YouTube o de Vimeo.' };
}

/**
 * Material de un workshop (parte A del plan de workshops): una imagen, un
 * archivo y un video. Se abre desde el icono «Material» de la pantalla de
 * workshops y devuelve el material a guardar; quien lo abre lo guarda.
 */
@Component({
    selector: 'app-material-workshop-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        ImageUploadComponent
    ],
    templateUrl: './material-workshop-dialog.component.html',
    styleUrls: ['./material-workshop-dialog.component.scss']
})
export class MaterialWorkshopDialogComponent {
    form: FormGroup;
    subiendo = false;
    errorArchivo: string | null = null;

    /** El archivo, aparte del formulario: lo fija la subida, no se escribe. */
    archivo: { fileName: string; fileOriginalName: string; fileSize: number } | null;

    readonly extensiones = EXTENSIONES.join(',');

    constructor(
        fb: FormBuilder,
        private eventService: EventService,
        private dialogRef: MatDialogRef<MaterialWorkshopDialogComponent, MaterialDeWorkshop>,
        @Inject(MAT_DIALOG_DATA) public workshop: Workshop
    ) {
        const m = workshop.material;
        this.form = fb.group({
            imageUrl: [m?.imageUrl ?? ''],
            videoUrl: [m?.videoUrl ?? '', enlaceDeVideoValido]
        });
        this.archivo = m?.fileName
            ? { fileName: m.fileName, fileOriginalName: m.fileOriginalName, fileSize: m.fileSize }
            : null;
    }

    get esVimeo(): boolean {
        return /vimeo\.com/i.test(this.form.value.videoUrl ?? '');
    }

    urlDelArchivo(): string {
        return this.archivo
            ? this.eventService.urlDeDocumento(this.archivo.fileName, this.archivo.fileOriginalName)
            : '';
    }

    tamano(bytes: number): string {
        return bytes >= 1024 * 1024
            ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
            : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    elegirArchivo(evento: globalThis.Event): void {
        const input = evento.target as HTMLInputElement;
        const elegido = input.files?.[0];
        input.value = '';
        if (!elegido) return;

        this.errorArchivo = this.validarArchivo(elegido);
        if (this.errorArchivo) return;

        this.subiendo = true;
        this.eventService.subirDocumento(elegido).subscribe({
            next: r => {
                this.archivo = { fileName: r.name, fileOriginalName: r.originalName, fileSize: r.size };
                this.subiendo = false;
            },
            error: err => {
                this.subiendo = false;
                this.errorArchivo = typeof err?.error === 'string' && err.error.trim()
                    ? this.capitalizar(err.error.trim())
                    : 'No se pudo subir el archivo. Inténtalo de nuevo.';
            }
        });
    }

    quitarArchivo(): void {
        this.archivo = null;
        this.errorArchivo = null;
    }

    guardar(): void {
        if (this.form.invalid || this.subiendo) return;
        this.dialogRef.close({
            imageUrl: (this.form.value.imageUrl ?? '').trim(),
            videoUrl: (this.form.value.videoUrl ?? '').trim(),
            fileName: this.archivo?.fileName ?? '',
            fileOriginalName: this.archivo?.fileOriginalName ?? '',
            fileSize: this.archivo?.fileSize ?? 0
        });
    }

    cancelar(): void {
        this.dialogRef.close();
    }

    /** Lo mismo que rechaza el servidor, antes de gastar la subida. */
    validarArchivo(archivo: File): string | null {
        const nombre = archivo.name.toLowerCase();
        if (!EXTENSIONES.some(ext => nombre.endsWith(ext))) {
            return 'Solo se admiten PDF, Word, Excel, PowerPoint o ZIP.';
        }
        if (archivo.size > TAMANO_MAXIMO) {
            return 'El archivo supera los 25 MB.';
        }
        return null;
    }

    private capitalizar(t: string): string {
        return t.charAt(0).toUpperCase() + t.slice(1);
    }
}
