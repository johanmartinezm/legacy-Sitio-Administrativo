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
