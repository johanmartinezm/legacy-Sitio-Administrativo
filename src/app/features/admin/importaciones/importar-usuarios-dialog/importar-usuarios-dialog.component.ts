import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FilaImportacion, ResultadoImportacion } from '../../../../core/models/importacion.model';
import { ImportacionService } from '../../../../core/services/importacion.service';
import { leerArchivoDeAsistentes } from '../../../../core/utils/lector-importacion';

/**
 * Carga masiva de cuentas desde el archivo de asistentes.
 *
 * Tres pasos y en este orden, que es lo que pide el plan
 * (`reports/20260826_plan_carga_masiva.md` §5, fase 2): se elige el archivo, se
 * **simula** —que no escribe nada— y solo si la simulación sale limpia se
 * habilita el botón de crear.
 *
 * Quien la usa no es técnico: los mensajes dicen qué fila y qué columna hay que
 * corregir **en el archivo**, no en el sistema.
 */
@Component({
    selector: 'app-importar-usuarios-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule,
        MatTableModule
    ],
    templateUrl: './importar-usuarios-dialog.component.html',
    styleUrls: ['./importar-usuarios-dialog.component.scss']
})
export class ImportarUsuariosDialogComponent {
    nombreArchivo = signal('');
    filas = signal<FilaImportacion[]>([]);
    columnasIgnoradas = signal<string[]>([]);
    columnasFaltantes = signal<string[]>([]);

    informe = signal<ResultadoImportacion | null>(null);
    /** True cuando el informe de arriba corresponde a una carga ya aplicada. */
    aplicado = signal(false);

    trabajando = signal(false);
    errorLectura = signal('');

    columnasDelInforme = ['fila', 'columna', 'motivo'];

    constructor(
        private servicio: ImportacionService,
        private dialogRef: MatDialogRef<ImportarUsuariosDialogComponent>,
        private snackBar: MatSnackBar
    ) { }

    /** El archivo se puede simular cuando tiene filas y no le falta ninguna columna. */
    get puedeSimular(): boolean {
        return this.filas().length > 0
            && this.columnasFaltantes().length === 0
            && !this.trabajando();
    }

    /**
     * Solo se puede crear cuentas después de una simulación **sin problemas**.
     * Es la regla que evita que alguien confirme una carga a medias.
     */
    get puedeAplicar(): boolean {
        const informe = this.informe();
        return !!informe
            && informe.simulacion
            && informe.problemas.length === 0
            && informe.nuevas > 0
            && !this.trabajando();
    }

    async archivoElegido(evento: Event): Promise<void> {
        const input = evento.target as HTMLInputElement;
        const archivo = input.files?.[0];
        if (!archivo) return;

        this.reiniciar();
        this.nombreArchivo.set(archivo.name);
        this.trabajando.set(true);

        try {
            const leido = await leerArchivoDeAsistentes(archivo);
            this.filas.set(leido.filas);
            this.columnasIgnoradas.set(leido.columnasIgnoradas);
            this.columnasFaltantes.set(leido.columnasFaltantes);

            if (leido.filas.length === 0) {
                this.errorLectura.set('El archivo no tiene ninguna fila con datos.');
            }
        } catch {
            this.errorLectura.set(
                'No se pudo leer el archivo. Tiene que ser un Excel (.xls o .xlsx) con la hoja de asistentes.'
            );
        } finally {
            this.trabajando.set(false);
            // Permite volver a elegir el mismo archivo después de corregirlo.
            input.value = '';
        }
    }

    simular(): void {
        this.trabajando.set(true);
        this.servicio.simular(this.filas()).subscribe({
            next: (informe) => {
                this.informe.set(informe);
                this.aplicado.set(false);
                this.trabajando.set(false);
            },
            error: (err) => {
                this.trabajando.set(false);
                this.avisarDelError(err, 'No se pudo revisar el archivo');
            }
        });
    }

    aplicar(): void {
        this.trabajando.set(true);
        this.servicio.aplicar(this.filas()).subscribe({
            next: (informe) => {
                this.informe.set(informe);
                this.aplicado.set(!informe.simulacion);
                this.trabajando.set(false);
                if (!informe.simulacion) {
                    this.snackBar.open(
                        `${informe.creadas} cuenta(s) creada(s)`,
                        'Cerrar',
                        { duration: 4000 }
                    );
                }
            },
            error: (err) => {
                this.trabajando.set(false);
                this.avisarDelError(err, 'No se pudo crear las cuentas');
            }
        });
    }

    cerrar(): void {
        // Se devuelve si hubo cambios, para que el listado se recargue solo.
        this.dialogRef.close(this.aplicado());
    }

    private reiniciar(): void {
        this.filas.set([]);
        this.columnasIgnoradas.set([]);
        this.columnasFaltantes.set([]);
        this.informe.set(null);
        this.aplicado.set(false);
        this.errorLectura.set('');
    }

    private avisarDelError(err: unknown, porDefecto: string): void {
        // El backend responde texto plano en los 400. Mostrarlo tal cual evita
        // el mensaje genérico que no dice qué corregir.
        const detalle = typeof (err as { error?: unknown })?.error === 'string'
            ? String((err as { error: string }).error).trim()
            : porDefecto;
        this.snackBar.open(detalle || porDefecto, 'Cerrar', { duration: 6000 });
    }
}
