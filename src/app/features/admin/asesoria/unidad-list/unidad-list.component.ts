import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsesoriaUnidad, iconoMaterial } from '../../../../core/models/asesoria-unidad.model';
import { AsesoriaUnidadAdminService } from '../../../../core/services/asesoria_unidad_admin.service';
import { UnidadFormDialogComponent } from '../unidad-form-dialog/unidad-form-dialog.component';

/** «Unidades de Asesoría»: las tarjetas de «NUESTRAS UNIDADES» en la app. */
@Component({
    selector: 'app-unidad-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './unidad-list.component.html',
    styleUrls: ['./unidad-list.component.scss']
})
export class UnidadListComponent implements OnInit {
    unidades = signal<AsesoriaUnidad[]>([]);
    cargando = signal(true);
    displayedColumns = ['orden', 'icono', 'titulo', 'necesidad', 'estado', 'acciones'];
    iconoMaterial = iconoMaterial;

    constructor(
        private unidadService: AsesoriaUnidadAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.unidadService.listAll().subscribe({
            next: (data) => {
                this.unidades.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las unidades', 'Cerrar', { duration: 4000 });
            }
        });
    }

    abrir(unidad?: AsesoriaUnidad): void {
        // Una nueva va al final: orden 10 por encima de la última.
        const siguienteOrden = Math.max(0, ...this.unidades().map(u => u.orden)) + 10;
        const dialogRef = this.dialog.open(UnidadFormDialogComponent, {
            width: '600px',
            data: unidad ? { ...unidad } : { siguienteOrden }
        });
        dialogRef.afterClosed().subscribe(guardada => {
            if (guardada) {
                this.snackBar.open('Unidad guardada', 'Cerrar', { duration: 3000 });
                this.cargar();
            }
        });
    }

    borrar(unidad: AsesoriaUnidad): void {
        if (!confirm(`¿Eliminar la unidad «${unidad.titulo}»? Si solo quiere ocultarla, edítela y desactívela.`)) {
            return;
        }
        this.unidadService.delete(unidad.id!).subscribe({
            next: () => {
                this.snackBar.open('Unidad eliminada', 'Cerrar', { duration: 3000 });
                this.cargar();
            },
            error: () => this.snackBar.open('No se pudo eliminar la unidad', 'Cerrar', { duration: 4000 })
        });
    }
}
