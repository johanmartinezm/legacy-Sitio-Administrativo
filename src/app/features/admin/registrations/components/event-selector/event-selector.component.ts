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
        this.eventService.getEvents().subscribe(events => {
            this.events = events;
        });
    }

    onSelectionChange(event: any) {
        this.eventSelected.emit(event.value);
    }
}
