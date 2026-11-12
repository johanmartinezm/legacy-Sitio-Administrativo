import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Event } from '../../../../../core/models/event.model';
import { EventService } from '../../../../../core/services/event.service';

@Component({
    selector: 'app-event-selector',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatSelectModule, MatFormFieldModule],
    template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Seleccionar Evento</mat-label>
      <mat-select [formControl]="eventControl" (selectionChange)="onSelectionChange($event)">
        <mat-option *ngFor="let event of events" [value]="event">
          {{event.title}} - {{event.startDate | date:'mediumDate'}}
          · {{ event.isFree ? 'Gratuito' : (event.price | currency:'COP':'symbol-narrow':'1.0-0') }}
          <ng-container *ngIf="event.status === 'inactive'"> · inactivo</ng-container>
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
    styles: ['.full-width { width: 100%; }']
})
export class EventSelectorComponent implements OnInit {
    eventControl = new FormControl<Event | null>(null);
    events: Event[] = [];

    @Output() eventSelected = new EventEmitter<Event>();

    constructor(private eventService: EventService) { }

    ngOnInit() {
        // Solo eventos que no han terminado, el más próximo primero. Los
        // inactivos se dejan: los de pago están inactivos por decisión mientras
        // no haya pasarela, y es justo a ellos a los que se inscribe a mano a
        // quien pagó por transferencia. Un evento sin fecha tampoco se esconde.
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        this.eventService.getEvents().subscribe(events => {
            this.events = events
                .filter(e => {
                    const fin = e.endDate ?? e.startDate;
                    return !fin || new Date(fin) >= hoy;
                })
                .sort((a, b) => this.tiempo(a) - this.tiempo(b));
        });
    }

    private tiempo(e: Event): number {
        return e.startDate ? new Date(e.startDate).getTime() : Number.MAX_SAFE_INTEGER;
    }

    onSelectionChange(event: any) {
        this.eventSelected.emit(event.value);
    }
}
