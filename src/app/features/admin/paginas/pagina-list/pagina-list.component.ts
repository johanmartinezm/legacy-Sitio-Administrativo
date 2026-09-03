import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaginaInformativa } from '../../../../core/models/pagina-informativa.model';
import { PaginaAdminService } from '../../../../core/services/pagina_admin.service';
import { PaginaFormDialogComponent } from '../pagina-form-dialog/pagina-form-dialog.component';

@Component({
    selector: 'app-pagina-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './pagina-list.component.html',
    styleUrls: ['./pagina-list.component.scss']
})
export class PaginaListComponent implements OnInit {
    paginas = signal<PaginaInformativa[]>([]);
    cargando = signal(true);
    displayedColumns: string[] = ['titulo', 'donde', 'estado', 'actualizada', 'acciones'];

    /**
     * Dónde aparece cada página dentro de la app. Vive aquí y no en la base
     * porque lo decide el código de la app, no el contenido: si mañana la
     * pantalla se mueve, lo que cambia es la app.
     */
    private readonly ubicaciones: Record<string, string> = {
        'legacy-board': 'Inicio → Explore libremente'
    };

    constructor(
        private paginaService: PaginaAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.cargarPaginas();
    }

    cargarPaginas(): void {
        this.cargando.set(true);
        this.paginaService.listAll().subscribe({
            next: (data) => {
                this.paginas.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las páginas', 'Cerrar', { duration: 4000 });
            }
        });
    }

    ubicacionDe(pagina: PaginaInformativa): string {
        return this.ubicaciones[pagina.slug] ?? '—';
    }

    editarPagina(pagina: PaginaInformativa): void {
        const dialogRef = this.dialog.open(PaginaFormDialogComponent, {
            width: '760px',
            data: { ...pagina }
        });

        dialogRef.afterClosed().subscribe(guardada => {
            if (guardada) {
                this.snackBar.open('Página guardada', 'Cerrar', { duration: 3000 });
                this.cargarPaginas();
            }
        });
    }
}
