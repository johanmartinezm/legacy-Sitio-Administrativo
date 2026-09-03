import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
    FilaImportacion,
    OpcionesImportacion,
    ResultadoImportacion
} from '../../../../core/models/importacion.model';
import { ImportacionService } from '../../../../core/services/importacion.service';
import { leerArchivoDeAsistentes } from '../../../../core/utils/lector-importacion';

/**
 * Con qué evento se abre el diálogo, si es que se abre con uno.
 *
 * Sin datos —o sin `eventoId`— es la entrada genérica de Usuarios: solo
 * cuentas. Con evento es la entrada de Inscritos, que además inscribe y trae
 * los dos interruptores.
 */
export interface DatosDeImportacion {
    eventoId?: string;
    tituloEvento?: string;
    /**
     * Un evento virtual no usa QR en absoluto: la app entrega el enlace de la
     * sesión y nunca la credencial. El interruptor se muestra apagado y
     * deshabilitado, con la razón al lado — dejarlo activable sería ofrecer una
     * decisión que no tiene efecto.
     */
    esVirtual?: boolean;
}

/**
 * Carga masiva desde el archivo de asistentes.
 *
 * Tres pasos y en este orden, que es lo que pide el plan
 * (`reports/20260826_plan_carga_masiva.md` §5, fases 2 y 3): se elige el
 * archivo, se **simula** —que no escribe nada— y solo si la simulación sale
 * limpia se habilita el botón de crear.
 *
 * **Es un solo diálogo para las dos entradas**, igual que el backend tiene un
 * solo importador y una sola ruta: lo único que cambia es si hay evento. Dos
 * pantallas sobre dos motores distintos se separan al tercer arreglo.
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
        MatTableModule,
        MatSlideToggleModule,
        MatTooltipModule
    ],
    templateUrl: './importar-usuarios-dialog.component.html',
    styleUrls: ['./importar-usuarios-dialog.component.scss']
})
export class ImportarUsuariosDialogComponent {
    nombreArchivo = signal('');
    filas = signal<FilaImportacion[]>([]);
    columnasIgnoradas = signal<string[]>([]);
    columnasFaltantes = signal<string[]>([]);
    /**
     * En qué fila de la hoja se encontraron las cabeceras.
     *
     * Se enseña porque el archivo del cliente **no las trae en la primera** —trae
     * su título arriba y un renglón en blanco— y el lector tiene que buscarlas.
     * Si alguna vez se equivoca de fila, quien mira el informe puede darse
     * cuenta; sin decirlo, el error saldría como «faltan columnas» y nadie
     * sabría por qué.
     */
    filaDeCabeceras = signal(0);

    informe = signal<ResultadoImportacion | null>(null);
    /** True cuando el informe de arriba corresponde a una carga ya aplicada. */
    aplicado = signal(false);

    trabajando = signal(false);
    errorLectura = signal('');

    /**
     * Cuántas filas van aplicadas, de cuántas.
     *
     * La carga va por tandas porque crear una cuenta cuesta ~120 ms —bcrypt— y
     * un archivo grande en una sola petición se pasaría del tiempo que aguanta
     * el proxy de delante. Con tandas, lo que hay que evitar es lo contrario:
     * que la pantalla parezca colgada durante un minuto sin decir nada.
     *
     * En cero significa que no hay carga en curso.
     */
    aplicadas = signal(0);
    porAplicar = signal(0);

    /**
     * Los dos interruptores de la entrada del evento, **los dos apagados por
     * defecto** y válidos para toda la carga (§4.1).
     *
     * Van en la importación y no en el evento: por evento la elección duraría
     * para siempre y afectaría también a quien se inscribe desde la app; aquí
     * lo que se quiere es decidir carga por carga.
     */
    generarCredencial = signal(false);
    avisarPorCorreo = signal(false);

    columnasDelInforme = ['fila', 'columna', 'motivo'];

    constructor(
        private servicio: ImportacionService,
        private dialogRef: MatDialogRef<ImportarUsuariosDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public datos: DatosDeImportacion | null
    ) { }

    /** True cuando el diálogo se abrió desde los inscritos de un evento. */
    get conEvento(): boolean {
        return !!this.datos?.eventoId;
    }

    /**
     * En un evento virtual el interruptor de credencial no hace nada:
     * `GetMyRegistrations` vacía el QR en cuanto el evento es virtual y entrega
     * el enlace en su lugar, y los correos hacen lo mismo. Se muestra apagado y
     * deshabilitado con la razón escrita al lado.
     */
    get credencialSinEfecto(): boolean {
        return this.conEvento && !!this.datos?.esVirtual;
    }

    private get opciones(): OpcionesImportacion {
        if (!this.conEvento) return {};
        return {
            evento_id: this.datos!.eventoId,
            // En un evento virtual se manda apagado siempre, coincida o no con
            // lo que se vea: el backend también lo rechaza, pero el panel no
            // tiene por qué pedir algo que no tiene sentido.
            generar_credencial: this.credencialSinEfecto ? false : this.generarCredencial(),
            avisar_por_correo: this.avisarPorCorreo()
        };
    }

    /** El archivo se puede simular cuando tiene filas y no le falta ninguna columna. */
    get puedeSimular(): boolean {
        return this.filas().length > 0
            && this.columnasFaltantes().length === 0
            && !this.trabajando();
    }

    /**
     * Solo se puede aplicar después de una simulación **sin problemas**. Es la
     * regla que evita que alguien confirme una carga a medias.
     *
     * Con evento basta con que haya algo que inscribir: una lista entera de
     * gente que ya tiene cuenta no crea ninguna, y aun así el trabajo —dejarlos
     * inscritos— sigue teniendo sentido.
     */
    get puedeAplicar(): boolean {
        const informe = this.informe();
        if (!informe || !informe.simulacion || informe.problemas.length > 0 || this.trabajando()) {
            return false;
        }
        return this.conEvento ? informe.por_inscribir > 0 : informe.nuevas > 0;
    }

    /** El texto del botón de confirmar cambia con la entrada. */
    get textoDeAplicar(): string {
        return this.conEvento ? 'Crear e inscribir' : 'Crear las cuentas';
    }

    /** True mientras corren las tandas, para enseñar el avance en vez de nada. */
    get aplicando(): boolean {
        return this.porAplicar() > 0;
    }

    /** El avance en tanto por ciento, para la barra. */
    get porcentaje(): number {
        const total = this.porAplicar();
        return total > 0 ? Math.round((this.aplicadas() / total) * 100) : 0;
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
            this.filaDeCabeceras.set(leido.filaDeCabeceras);

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

    /**
     * Cambiar un interruptor invalida la revisión hecha.
     *
     * No es cosmético: el informe que se está mirando se calculó con las otras
     * opciones, y dejarlo en pantalla haría creer que se confirmó lo que se ve.
     * Se vuelve a revisar y ya está.
     */
    interruptorCambiado(): void {
        if (this.informe() && !this.aplicado()) {
            this.informe.set(null);
        }
    }

    simular(): void {
        this.trabajando.set(true);
        this.servicio.simular(this.filas(), this.opciones).subscribe({
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
        this.aplicadas.set(0);
        this.porAplicar.set(this.filas().length);

        this.servicio.aplicar(
            this.filas(),
            this.opciones,
            (hechas, total) => {
                this.aplicadas.set(hechas);
                this.porAplicar.set(total);
            }
        ).subscribe({
            next: (informe) => {
                this.informe.set(informe);
                this.aplicado.set(!informe.simulacion);
                this.trabajando.set(false);
                this.porAplicar.set(0);
                if (!informe.simulacion) {
                    this.snackBar.open(this.resumenDeLaCarga(informe), 'Cerrar', { duration: 5000 });
                }
            },
            error: (err) => {
                this.trabajando.set(false);
                this.porAplicar.set(0);
                // Si cayó a mitad de las tandas, lo ya creado está creado. Se
                // dice, porque el reflejo de quien lo ve es pensar que no se
                // hizo nada y volver a intentarlo a ciegas.
                const yaHechas = this.aplicadas();
                this.avisarDelError(err, yaHechas > 0
                    ? `La carga se cortó tras ${yaHechas} fila(s), que sí quedaron creadas. `
                      + 'Vuelve a pasar el mismo archivo: las hechas se saltan y sigue donde se quedó.'
                    : 'No se pudo completar la carga');
            }
        });
    }

    cerrar(): void {
        // Se devuelve si hubo cambios, para que el listado se recargue solo.
        this.dialogRef.close(this.aplicado());
    }

    private resumenDeLaCarga(informe: ResultadoImportacion): string {
        if (!this.conEvento) {
            return `${informe.creadas} cuenta(s) creada(s)`;
        }
        return `${informe.inscritas} inscrito(s), ${informe.creadas} cuenta(s) nueva(s)`;
    }

    private reiniciar(): void {
        this.aplicadas.set(0);
        this.porAplicar.set(0);
        this.filas.set([]);
        this.columnasIgnoradas.set([]);
        this.columnasFaltantes.set([]);
        this.filaDeCabeceras.set(0);
        this.informe.set(null);
        this.aplicado.set(false);
        this.errorLectura.set('');
    }

    private avisarDelError(err: unknown, porDefecto: string): void {
        // El backend responde texto plano en los 400 y en el 409 del evento
        // virtual. Mostrarlo tal cual evita el mensaje genérico que no dice qué
        // corregir.
        const detalle = typeof (err as { error?: unknown })?.error === 'string'
            ? String((err as { error: string }).error).trim()
            : porDefecto;
        this.snackBar.open(detalle || porDefecto, 'Cerrar', { duration: 6000 });
    }
}
