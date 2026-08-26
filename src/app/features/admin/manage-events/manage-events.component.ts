import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
// El template ya usaba matTooltip en los cinco botones de acciones sin importar
// su modulo, asi que ninguno mostraba nada al pasar el raton. Hace falta para
// que se lea el de ocultar/mostrar, que es el unico cuyo icono no se explica
// solo.
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatTooltipModule,
    MatSnackBarModule,
    CalendarViewComponent
  ],
  templateUrl: './manage-events.component.html',
  styleUrls: ['./manage-events.component.scss']
})
export class ManageEventsComponent implements OnInit {
  events: Event[] = [];
  displayedColumns: string[] = ['image', 'title', 'description', 'workshops', 'status', 'actions'];

  constructor(
    private eventService: EventService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
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

  /**
   * Los inscritos van a pantalla propia, no a un dialogo como el feedback y la
   * encuesta: la lista puede ser larga, se recorre buscando a alguien concreto
   * y su URL sirve para dejarla abierta en la puerta del evento.
   */
  viewRegistrants(event: Event) {
    this.router.navigate(['/admin/events', event.id, 'registrations']);
  }

  /**
   * Oculta un evento de la app o lo vuelve a mostrar.
   *
   * Hasta el 2026-08-26 esto no se podia hacer desde ninguna pantalla: la
   * columna `status` decide si el evento sale en la app, pero el formulario no
   * la enviaba y el PUT del evento la ignora, asi que un evento oculto solo se
   * recuperaba por SQL. Y en esta misma lista se veia igual que los demas.
   *
   * Se pide confirmacion porque el efecto no se ve aqui, sino en la app de
   * quien la tenga abierta.
   */
  toggleStatus(event: Event) {
    const ocultar = event.status !== 'inactive';
    const pregunta = ocultar
      ? `¿Ocultar "${event.title}" de la aplicación? Dejará de aparecer en el listado. Quien ya esté inscrito conserva su credencial.`
      : `¿Volver a mostrar "${event.title}" en la aplicación?`;

    if (!confirm(pregunta)) {
      return;
    }

    const nuevo = ocultar ? 'inactive' : 'active';
    this.eventService.updateStatus(event.id, nuevo).subscribe({
      next: () => {
        this.snackBar.open(
          ocultar ? 'El evento ya no se ve en la aplicación.' : 'El evento vuelve a verse en la aplicación.',
          'Cerrar',
          { duration: 4000 }
        );
        this.loadEvents();
      },
      // Sin este callback el fallo no dejaria rastro: la lista se quedaria como
      // estaba y pareceria que el cambio se guardo. Mismo patron que
      // users-list y banner-list.
      error: () => {
        this.snackBar.open('No se pudo cambiar la visibilidad del evento. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 });
      }
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
