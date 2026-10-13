import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SeccionInicio } from '../../../../core/models/seccion-inicio.model';
import { SeccionInicioAdminService } from '../../../../core/services/seccion_inicio_admin.service';
import { SeccionInicioDialogComponent } from '../seccion-inicio-dialog/seccion-inicio-dialog.component';

@Component({
    selector: 'app-seccion-inicio-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './seccion-inicio-list.component.html',
    styleUrls: ['./seccion-inicio-list.component.scss']
})
export class SeccionInicioListComponent implements OnInit {
    secciones = signal<SeccionInicio[]>([]);
    cargando = signal(true);
    displayedColumns: string[] = ['imagen', 'nombre', 'donde', 'actualizada', 'acciones'];

    /**
     * Dónde está cada tarjeta en el Inicio. Vive aquí y no en la base porque lo
     * decide el código de la app, igual que en Páginas de la App.
     */
    private readonly ubicaciones: Record<string, string> = {
        'nuevo-cada-semana': 'Destacado, arriba del todo',
        'beneficios': 'Explore libremente y Servicios Legacy (las dos tarjetas)',
        'miembros': 'Servicios Legacy',
        'legacy-test': 'Bloque final del Inicio'
    };

    constructor(
        private seccionService: SeccionInicioAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.cargarSecciones();
    }

    cargarSecciones(): void {
        this.cargando.set(true);
        this.seccionService.listAll().subscribe({
            next: (data) => {
                this.secciones.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las secciones', 'Cerrar', { duration: 4000 });
            }
        });
    }

    ubicacionDe(seccion: SeccionInicio): string {
        return this.ubicaciones[seccion.slug] ?? 'Explore libremente';
    }

    editar(seccion: SeccionInicio): void {
        const dialogRef = this.dialog.open(SeccionInicioDialogComponent, {
            width: '640px',
            data: { ...seccion }
        });

        dialogRef.afterClosed().subscribe(guardada => {
            if (guardada) {
                this.snackBar.open('Imagen guardada', 'Cerrar', { duration: 3000 });
                this.cargarSecciones();
            }
        });
    }
}
