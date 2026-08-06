import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';
import { EventFormDialogComponent } from '../event-form-dialog/event-form-dialog.component';
import { FeedbackDialogComponent } from '../feedback-dialog/feedback-dialog.component';
import { SurveySummaryDialogComponent } from '../survey-summary-dialog/survey-summary-dialog.component';
import { CalendarViewComponent } from '../calendar-view/calendar-view.component';

@Component({
  selector: 'app-manage-events',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatTabsModule,
    CalendarViewComponent
  ],
  templateUrl: './manage-events.component.html',
  styleUrls: ['./manage-events.component.scss']
})
export class ManageEventsComponent implements OnInit {
  events: Event[] = [];
  displayedColumns: string[] = ['image', 'title', 'description', 'workshops', 'actions'];

  constructor(
    private eventService: EventService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getEvents().subscribe(data => {
      this.events = data;
    });
  }

  createEvent() {
    const dialogRef = this.dialog.open(EventFormDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'full-screen-modal'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eventService.createEvent(result).subscribe(() => {
          this.loadEvents();
        });
      }
    });
  }

  editEvent(event: Event) {
    const dialogRef = this.dialog.open(EventFormDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: true,
      data: { event },
      panelClass: 'full-screen-modal' // Add class for extra styling if needed
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eventService.updateEvent(result).subscribe(() => {
          this.loadEvents();
        });
      }
    });
  }

  viewFeedback(event: Event) {
    this.dialog.open(FeedbackDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { event }
    });
  }

  /**
   * Encuesta del evento completo, distinta del feedback por taller que abre
   * viewFeedback. El endpoint existe desde el 05 y hasta ahora no lo mostraba
   * nadie.
   */
  viewSurvey(event: Event) {
    this.dialog.open(SurveySummaryDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { event }
    });
  }

  deleteEvent(id: string) {
    if (confirm('¿Está seguro de eliminar este evento?')) {
      this.eventService.deleteEvent(id).subscribe(() => {
        this.loadEvents();
      });
    }
  }
}
