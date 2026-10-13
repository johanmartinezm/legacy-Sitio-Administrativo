import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    GRUPOS_LEGACY_PLUS,
    LegacyPlusItem,
    MAX_TEXTO_LEGACY_PLUS,
    MAX_TITULO_LEGACY_PLUS
} from '../../../../core/models/legacy-plus-item.model';
import { LegacyPlusItemAdminService } from '../../../../core/services/legacy_plus_item_admin.service';

/** El punto a editar (null si es nuevo) y todos, para proponer el orden. */
export interface DatosItemDialog {
    item: LegacyPlusItem | null;
    todos: LegacyPlusItem[];
}

@Component({
    selector: 'app-legacy-plus-item-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule
    ],
    templateUrl: './item-form-dialog.component.html',
    styleUrls: ['./item-form-dialog.component.scss']
})
export class ItemFormDialogComponent {
    readonly maxTitulo = MAX_TITULO_LEGACY_PLUS;
    readonly maxTexto = MAX_TEXTO_LEGACY_PLUS;
    readonly grupos = GRUPOS_LEGACY_PLUS;

    form: FormGroup;
    editando: LegacyPlusItem | null;
    guardando = false;

    constructor(
        fb: FormBuilder,
        private itemService: LegacyPlusItemAdminService,
        private dialogRef: MatDialogRef<ItemFormDialogComponent>,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) private data: DatosItemDialog
    ) {
        this.editando = data.item;
        const base = this.editando;
        this.form = fb.nonNullable.group({
            grupo: [base?.grupo ?? 'incluye', Validators.required],
            titulo: [base?.titulo ?? '', [Validators.required, Validators.maxLength(MAX_TITULO_LEGACY_PLUS)]],
            texto: [base?.texto ?? '', [Validators.maxLength(MAX_TEXTO_LEGACY_PLUS)]],
            orden: [base?.orden ?? this.siguienteOrden('incluye'), Validators.required],
            activo: [base?.activo ?? true]
        });
        // Un punto nuevo propone el orden siguiente al último de su grupo.
        if (!base) {
            this.form.get('grupo')!.valueChanges.subscribe(g =>
                this.form.get('orden')!.setValue(this.siguienteOrden(g)));
        }
    }

    private siguienteOrden(grupo: string): number {
        const ordenes = this.data.todos.filter(i => i.grupo === grupo).map(i => i.orden);
        return Math.max(0, ...ordenes) + 10;
    }

    guardar(): void {
        if (this.form.invalid || this.guardando) {
            this.form.markAllAsTouched();
            return;
        }
        this.guardando = true;
        const valor = this.form.getRawValue() as LegacyPlusItem;
        const item: LegacyPlusItem = {
            ...valor,
            titulo: valor.titulo.trim(),
            texto: valor.texto.trim(),
            orden: Number(valor.orden) || 0
        };
        const peticion = this.editando?.id
            ? this.itemService.update(this.editando.id, item)
            : this.itemService.create(item);

        peticion.subscribe({
            next: () => this.dialogRef.close(true),
            error: (err) => {
                this.guardando = false;
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo guardar el punto';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
