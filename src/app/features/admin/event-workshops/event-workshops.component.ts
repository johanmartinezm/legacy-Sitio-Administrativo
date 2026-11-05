import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventService, ResumenWorkshops } from '../../../core/services/event.service';
import { Event, Workshop } from '../../../core/models/event.model';
import {
    DatosDelTaller,
    WorkshopFormDialogComponent
} from '../workshop-form-dialog/workshop-form-dialog.component';
import { MaterialWorkshopDialogComponent } from '../material-workshop-dialog/material-workshop-dialog.component';
import { MaterialDeWorkshop } from '../../../core/models/event.model';

/**
 * Talleres de un evento. Se llega desde el icono de "Administrar Eventos".
 *
 * Desde el 2026-10-28 es el único sitio donde se tocan los talleres: el
 * formulario del evento ya no los lleva, y cada taller se guarda por su cuenta.
 * Así editar uno conserva su id —y con él la agenda de los usuarios, las
 * inscripciones a ese taller y las calificaciones—, cosa que el formulario
 * anterior no hacía: los borraba y recreaba todos en cada guardado.
 */
@Component({
    selector: 'app-event-workshops',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './event-workshops.component.html',
    styleUrls: ['./event-workshops.component.scss']
})
export class EventWorkshopsComponent implements OnInit {
    displayedColumns = ['name', 'speaker', 'room', 'schedule', 'elegidos', 'actions'];

    eventId = '';
    evento = signal<Event | null>(null);
    workshops = signal<Workshop[]>([]);
    isLoading = signal(true);
    errorMessage = signal<string | null>(null);
    /**
     * Inscritos y elegidos por taller. Si no llega, la tabla sale igual, sin la
     * columna de elegidos y sin el aviso al guardar.
     */
    resumen = signal<ResumenWorkshops | null>(null);

    constructor(
        private route: ActivatedRoute,
        private eventService: EventService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
        this.cargar();
    }

    cargar(): void {
        this.isLoading.set(true);
        this.eventService.getEventById(this.eventId).subscribe({
            next: evento => {
                this.evento.set(evento);
                this.workshops.set(evento.workshops ?? []);
                this.errorMessage.set(null);
                this.isLoading.set(false);
            },
            error: () => {
                this.errorMessage.set('No se pudo cargar el evento. Vuelve al listado e inténtalo de nuevo.');
                this.isLoading.set(false);
            }
        });
        this.eventService.getResumenWorkshops(this.eventId).subscribe({
            next: resumen => this.resumen.set(resumen),
            error: () => this.resumen.set(null)
        });
    }

    elegidosDe(workshop: Workshop): number {
        return this.resumen()?.elegidos?.[workshop.id] ?? 0;
    }

    /**
     * Agregar un taller o cambiarle el horario puede formar un horario nuevo en
     * la app (§10.6, punto 5 del plan de workshops). Quien ya se inscribió solo
     * puede ajustar su elección hasta el día anterior al evento. Solo avisa, no
     * impide.
     */
    private confirmaCambioDeHorario(nuevo: Workshop, anterior?: Workshop): boolean {
        const inscritos = this.resumen()?.inscritos ?? 0;
        if (inscritos === 0) return true;

        const mismoHorario = (a: Date | string, b: Date | string) =>
            new Date(a).getTime() === new Date(b).getTime();
        if (anterior &&
            mismoHorario(nuevo.startDateTime, anterior.startDateTime) &&
            mismoHorario(nuevo.endDateTime, anterior.endDateTime)) {
            return true;
        }

        const accion = anterior ? 'Cambiar el horario de este workshop' : 'Agregar este workshop';
        const personas = inscritos === 1 ? '1 inscrito' : `${inscritos} inscritos`;
        return confirm(
            `Este evento ya tiene ${personas}.\n\n` +
            `${accion} puede crear un horario nuevo en la app. Quienes ya se inscribieron pueden ` +
            'ajustar su elección hasta el día anterior al evento; los que no lo hagan quedarán sin ' +
            'workshop en ese horario.\n\n¿Guardar igual?'
        );
    }

    agregar(): void {
        this.abrirFormulario({ fechaDelEvento: this.evento()?.startDate });
    }

    editar(workshop: Workshop): void {
        this.abrirFormulario({ workshop });
    }

    private abrirFormulario(data: DatosDelTaller): void {
        const dialogRef = this.dialog.open(WorkshopFormDialogComponent, {
            width: '95vw',
            maxWidth: '900px',
            maxHeight: '90vh',
            disableClose: true,
            data
        });

        dialogRef.afterClosed().subscribe((taller?: Workshop) => {
            if (!taller) return;
            if (!this.confirmaCambioDeHorario(taller, data.workshop)) return;
            const guardar = data.workshop
                ? this.eventService.updateWorkshop(taller)
                : this.eventService.createWorkshop(this.eventId, taller);

            guardar.subscribe({
                next: () => {
                    this.snackBar.open(data.workshop ? 'Workshop actualizado.' : 'Workshop agregado.', 'Cerrar', { duration: 3000 });
                    this.cargar();
                },
                error: err => {
                    // El backend explica en español por qué rechaza un taller
                    // (sin nombre, horario al revés); se muestra tal cual.
                    const motivo = typeof err?.error === 'string' && err.status === 400 ? err.error.trim() : null;
                    this.snackBar.open(motivo ?? 'No se pudo guardar el workshop. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 });
                }
            });
        });
    }

    /** Si el workshop tiene algo de material: imagen, archivo o video. */
    tieneMaterial(w: Workshop): boolean {
        const m = w.material;
        return !!(m && (m.imageUrl || m.fileName || m.videoUrl));
    }

    /**
     * Material del workshop (parte A del plan de workshops). Ruta propia: el PUT
     * del workshop no lo lleva, y así editar el workshop no lo borra.
     */
    material(workshop: Workshop): void {
        const dialogRef = this.dialog.open(MaterialWorkshopDialogComponent, {
            width: '95vw',
            maxWidth: '640px',
            maxHeight: '90vh',
            disableClose: true,
            data: workshop
        });

        dialogRef.afterClosed().subscribe((material?: MaterialDeWorkshop) => {
            if (!material) return;
            this.eventService.guardarMaterial(workshop.id, material).subscribe({
                next: () => {
                    this.snackBar.open('Material guardado.', 'Cerrar', { duration: 3000 });
                    this.cargar();
                },
                error: err => {
                    const motivo = typeof err?.error === 'string' && err.status === 400 ? err.error.trim() : null;
                    this.snackBar.open(
                        motivo ? motivo.charAt(0).toUpperCase() + motivo.slice(1) : 'No se pudo guardar el material. Inténtalo de nuevo.',
                        'Cerrar', { duration: 5000 });
                }
            });
        });
    }

    /**
     * Solo advierte, no impide: por decisión del 2026-10-28 un taller con
     * inscritos o calificaciones se puede borrar igual, pero quien lo hace tiene
     * que saber qué se lleva por delante el ON DELETE CASCADE.
     */
    eliminar(workshop: Workshop): void {
        const pregunta = `¿Eliminar el workshop "${workshop.name}"?\n\n` +
            'También se borrarán, sin posibilidad de recuperarlos: la agenda de quienes lo guardaron, ' +
            'la elección de este workshop en las inscripciones y sus calificaciones.';
        if (!confirm(pregunta)) return;

        this.eventService.deleteWorkshop(workshop.id).subscribe({
            next: () => {
                this.snackBar.open('Workshop eliminado.', 'Cerrar', { duration: 3000 });
                this.cargar();
            },
            error: () => {
                this.snackBar.open('No se pudo eliminar el workshop. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 });
            }
        });
    }
}
