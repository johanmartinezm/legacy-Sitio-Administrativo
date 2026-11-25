import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogoBoard, MAX_ETIQUETA_OPCION_BOARD, OpcionBoard } from '../../../../core/models/board-opcion.model';
import { BoardOpcionAdminService } from '../../../../core/services/board_opcion_admin.service';

export interface DatosOpcionDialog {
    opcion: OpcionBoard | null;
    catalogo: CatalogoBoard;
    siguienteOrden: number;
}

@Component({
    selector: 'app-opcion-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule
    ],
    templateUrl: './opcion-form-dialog.component.html',
    styleUrls: ['./opcion-form-dialog.component.scss']
})
export class OpcionFormDialogComponent {
    readonly maxEtiqueta = MAX_ETIQUETA_OPCION_BOARD;
    readonly catalogo: CatalogoBoard;

    form: FormGroup;
    editando: OpcionBoard | null;
    guardando = false;

    constructor(
        fb: FormBuilder,
        private servicio: BoardOpcionAdminService,
        private dialogRef: MatDialogRef<OpcionFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) data: DatosOpcionDialog
    ) {
        this.editando = data.opcion;
        this.catalogo = data.catalogo;
        const base = this.editando;
        this.form = fb.nonNullable.group({
            etiqueta: [base?.etiqueta ?? '', [Validators.required, Validators.maxLength(MAX_ETIQUETA_OPCION_BOARD), Validators.pattern(/\S/)]],
            orden: [base?.orden ?? data.siguienteOrden, [Validators.required, Validators.min(0), Validators.max(100000)]],
            activo: [base?.activo ?? true]
        });
    }

    guardar(): void {
        if (this.form.invalid || this.guardando) {
            this.form.markAllAsTouched();
            return;
        }
        this.guardando = true;
        const v = this.form.getRawValue();
        const cambios = {
            etiqueta: v.etiqueta.trim(),
            orden: Number(v.orden) || 0,
            activo: v.activo
        };
        const peticion = this.editando?.id
            ? this.servicio.update(this.editando.id, cambios)
            : this.servicio.create({ ...cambios, catalogo: this.catalogo.clave });

        peticion.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
