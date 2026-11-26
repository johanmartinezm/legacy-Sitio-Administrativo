import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAX_MOTIVO_BOARD } from '../../../../core/models/board-envio.model';

export interface DatosDecision {
    decision: 'aprobada' | 'rechazada';
    nombre: string;
}

/**
 * Confirma la decisión del comité. Rechazar exige el motivo; aprobar admite una
 * nota. En los dos casos el texto queda en el panel y la persona no lo recibe:
 * su aviso solo dice si fue aprobada o no.
 */
@Component({
    selector: 'app-decision-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
    template: `
        <h2 mat-dialog-title>{{ rechazar ? 'Rechazar' : 'Aprobar' }} a {{ data.nombre || 'esta persona' }}</h2>
        <mat-dialog-content>
            <p class="nota">
                La persona recibirá un aviso en la app y un correo diciendo que
                {{ rechazar ? 'esta vez no fue aprobada' : 'fue aprobada' }}.
                {{ rechazar ? 'El motivo no se le envía: queda como nota del comité.' : '' }}
            </p>
            <mat-form-field appearance="outline" class="campo">
                <mat-label>{{ rechazar ? 'Motivo del rechazo' : 'Nota del comité (opcional)' }}</mat-label>
                <textarea matInput rows="4" [(ngModel)]="motivo" [maxlength]="maximo" cdkFocusInitial></textarea>
                <mat-hint align="end">{{ motivo.length }}/{{ maximo }}</mat-hint>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cancelar</button>
            <button mat-flat-button [color]="rechazar ? 'warn' : 'primary'" [disabled]="rechazar && !motivo.trim()"
                (click)="confirmar()">{{ rechazar ? 'Rechazar' : 'Aprobar' }}</button>
        </mat-dialog-actions>
    `,
    styles: [`
        .nota { margin: 0 0 16px; color: #475569; font-size: 13px; line-height: 1.5; }
        .campo { width: 100%; }
    `]
})
export class DecisionDialogComponent {
    readonly maximo = MAX_MOTIVO_BOARD;
    readonly rechazar: boolean;
    motivo = '';

    constructor(
        private dialogRef: MatDialogRef<DecisionDialogComponent, string>,
        @Inject(MAT_DIALOG_DATA) public data: DatosDecision
    ) {
        this.rechazar = data.decision === 'rechazada';
    }

    confirmar(): void {
        this.dialogRef.close(this.motivo.trim());
    }
}
