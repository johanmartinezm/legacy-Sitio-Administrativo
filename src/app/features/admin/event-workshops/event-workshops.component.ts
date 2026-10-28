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
import { EventService } from '../../../core/services/event.service';
import { Event, Workshop } from '../../../core/models/event.model';
import {
    DatosDelTaller,
    WorkshopFormDialogComponent
} from '../workshop-form-dialog/workshop-form-dialog.component';

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
    displayedColumns = ['name', 'speaker', 'room', 'schedule', 'actions'];

    eventId = '';
    evento = signal<Event | null>(null);
    workshops = signal<Workshop[]>([]);
    isLoading = signal(true);
    errorMessage = signal<string | null>(null);

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
            const guardar = data.workshop
                ? this.eventService.updateWorkshop(taller)
                : this.eventService.createWorkshop(this.eventId, taller);

            guardar.subscribe({
                next: () => {
                    this.snackBar.open(data.workshop ? 'Taller actualizado.' : 'Taller agregado.', 'Cerrar', { duration: 3000 });
                    this.cargar();
                },
                error: err => {
                    // El backend explica en español por qué rechaza un taller
                    // (sin nombre, horario al revés); se muestra tal cual.
                    const motivo = typeof err?.error === 'string' && err.status === 400 ? err.error.trim() : null;
                    this.snackBar.open(motivo ?? 'No se pudo guardar el taller. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 });
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
        const pregunta = `¿Eliminar el taller "${workshop.name}"?\n\n` +
            'También se borrarán, sin posibilidad de recuperarlos: la agenda de quienes lo guardaron, ' +
            'la elección de este taller en las inscripciones y sus calificaciones.';
        if (!confirm(pregunta)) return;

        this.eventService.deleteWorkshop(workshop.id).subscribe({
            next: () => {
                this.snackBar.open('Taller eliminado.', 'Cerrar', { duration: 3000 });
                this.cargar();
            },
            error: () => {
                this.snackBar.open('No se pudo eliminar el taller. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 });
            }
        });
    }
}
