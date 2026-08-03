import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Workshop } from '../../../../../core/models/event.model';

@Component({
    selector: 'app-workshop-list',
    standalone: true,
    imports: [CommonModule, MatCheckboxModule, FormsModule],
    template: `
    <div class="workshop-list">
      <h3>Talleres Disponibles</h3>
      <div *ngIf="workshops.length === 0" class="no-workshops">
        No hay talleres disponibles para este evento.
      </div>
      <div *ngFor="let shop of workshops" class="workshop-item">
        <mat-checkbox 
            [checked]="isSelected(shop)"
            (change)="toggleWorkshop(shop, $event.checked)">
            <div class="workshop-info">
                <strong>{{shop.name}}</strong>
                <span>{{shop.startDateTime | date:'shortTime'}} - {{shop.room}}</span>
                <small>{{shop.speaker}}</small>
            </div>
        </mat-checkbox>
      </div>
    </div>
  `,
    styles: [`
    .workshop-list { margin-top: 16px; }
    .workshop-item { margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;}
    .workshop-info { display: flex; flex-direction: column; margin-left: 8px; }
    .no-workshops { color: #888; font-style: italic; }
  `]
})
export class WorkshopListComponent {
    @Input() workshops: Workshop[] = [];
    @Output() selectionChange = new EventEmitter<Workshop[]>();

    selectedWorkshops: Workshop[] = [];

    isSelected(shop: Workshop): boolean {
        return this.selectedWorkshops.some(s => s.id === shop.id);
    }

    toggleWorkshop(shop: Workshop, isChecked: boolean) {
        if (isChecked) {
            this.selectedWorkshops.push(shop);
        } else {
            this.selectedWorkshops = this.selectedWorkshops.filter(s => s.id !== shop.id);
        }
        this.selectionChange.emit(this.selectedWorkshops);
    }
}
