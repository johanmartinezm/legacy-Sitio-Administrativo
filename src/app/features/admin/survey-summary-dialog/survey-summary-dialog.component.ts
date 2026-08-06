import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { EventService } from '../../../core/services/event.service';
import { EventSurveySummary } from '../../../core/models/survey.model';
import { Event } from '../../../core/models/event.model';

/**
 * Muestra el resumen de la encuesta general del evento.
 *
 * No sustituye a FeedbackDialogComponent: aquél lista las calificaciones de
 * cada taller, éste resume el evento completo. Son dos preguntas distintas y
 * dos endpoints distintos.
 */
@Component({
    selector: 'app-survey-summary-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatDividerModule,
        MatProgressBarModule
    ],
    templateUrl: './survey-summary-dialog.component.html',
    styleUrls: ['./survey-summary-dialog.component.scss']
})
export class SurveySummaryDialogComponent implements OnInit {
    summary?: EventSurveySummary;
    isLoading = true;
    /** Mensaje de error ya traducido; null mientras no haya fallado nada. */
    errorMessage: string | null = null;

    constructor(
        private eventService: EventService,
        private dialogRef: MatDialogRef<SurveySummaryDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { event: Event }
    ) { }

    ngOnInit(): void {
        this.eventService.getEventSurveySummary(this.data.event.id).subscribe({
            next: (summary) => {
                this.summary = summary;
                this.isLoading = false;
            },
            error: (err) => {
                // El 403 es el fallo probable aquí y merece su propio mensaje:
                // la ruta es AdminOnly, así que quien lo vea está entrando con
                // un token que no es de administrador. Un "error al cargar"
                // genérico mandaría a buscar el problema al sitio equivocado.
                this.errorMessage = err?.status === 403
                    ? 'Esta información es solo para administradores.'
                    : 'No se pudo cargar la encuesta. Intenta de nuevo.';
                this.isLoading = false;
            }
        });
    }

    /** Las cuatro medias, ya listas para pintar en la plantilla. */
    get averages(): { label: string; value: number | null }[] {
        return [
            { label: 'General', value: this.summary?.overallAverage ?? null },
            { label: 'Organización', value: this.summary?.organizationAverage ?? null },
            { label: 'Contenido', value: this.summary?.contentAverage ?? null },
            { label: 'Conferencistas', value: this.summary?.speakersAverage ?? null }
        ];
    }

    /** El backend manda la proporción (0 a 1); aquí se muestra en porcentaje. */
    get recommendPercent(): number | null {
        const rate = this.summary?.recommendRate;
        return rate === null || rate === undefined ? null : Math.round(rate * 100);
    }

    getStars(rating: number): number[] {
        return Array(Math.round(rating)).fill(0);
    }

    getEmptyStars(rating: number): number[] {
        return Array(5 - Math.round(rating)).fill(0);
    }

    close() {
        this.dialogRef.close();
    }
}
