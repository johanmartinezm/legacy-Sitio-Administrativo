import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { EventService } from '../../../core/services/event.service';
import { WorkshopRating } from '../../../core/models/rating.model';
import { Event } from '../../../core/models/event.model';

/** Promedio de un taller, para la tabla «Por taller». */
export interface ResumenDeTaller {
    nombre: string;
    promedio: number;
    cantidad: number;
}

/** Agrupa por id de taller, no por nombre: dos talleres pueden llamarse igual. */
export function resumirPorTaller(ratings: WorkshopRating[]): ResumenDeTaller[] {
    const grupos = new Map<string, { nombre: string; suma: number; cantidad: number }>();
    for (const r of ratings) {
        const g = grupos.get(r.workshopId) ?? { nombre: r.workshopName, suma: 0, cantidad: 0 };
        g.suma += r.rating;
        g.cantidad++;
        grupos.set(r.workshopId, g);
    }
    return [...grupos.values()]
        .map(g => ({ nombre: g.nombre, promedio: g.suma / g.cantidad, cantidad: g.cantidad }))
        .sort((a, b) => b.promedio - a.promedio || b.cantidad - a.cantidad);
}

@Component({
    selector: 'app-feedback-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatListModule,
        MatDividerModule
    ],
    templateUrl: './feedback-dialog.component.html',
    styleUrls: ['./feedback-dialog.component.scss']
})
export class FeedbackDialogComponent implements OnInit {
    ratings: WorkshopRating[] = [];
    isLoading = true;
    averageRating = 0;
    /**
     * Hasta el 2026-10-28 solo había el promedio del evento: con varios
     * talleres, saber cuál gustó y cuál no obligaba a recorrer la lista
     * entera. Ordenado de mejor a peor calificado.
     */
    porTaller: ResumenDeTaller[] = [];

    constructor(
        private eventService: EventService,
        private dialogRef: MatDialogRef<FeedbackDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { event: Event }
    ) { }

    ngOnInit(): void {
        this.eventService.getEventFeedback(this.data.event.id).subscribe({
            next: (feedback) => {
                this.ratings = feedback;
                this.calculateAverage();
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    calculateAverage() {
        if (this.ratings.length === 0) return;
        const sum = this.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        this.averageRating = sum / this.ratings.length;
        this.porTaller = resumirPorTaller(this.ratings);
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
