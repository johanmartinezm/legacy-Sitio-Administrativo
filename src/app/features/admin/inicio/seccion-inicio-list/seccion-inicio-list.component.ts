import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CAMPOS_POR_PANTALLA, Pantalla, SeccionInicio, TEXTOS_POR_DEFECTO, pantallaDe } from '../../../../core/models/seccion-inicio.model';
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
/**
 * Sirve a dos páginas del panel, según `data.pantalla` de la ruta: «Tarjetas
 * del Inicio» (admin/inicio) y «Textos de LSO» (admin/lso). Las dos editan
 * filas de core.secciones_inicio; qué campos lleva cada una lo dice
 * CAMPOS_POR_PANTALLA.
 */
export class SeccionInicioListComponent implements OnInit {
    private todas = signal<SeccionInicio[]>([]);
    readonly pantalla: Pantalla;
    secciones = computed(() => this.todas().filter(s => pantallaDe(s.pantalla) === this.pantalla));
    cargando = signal(true);
    displayedColumns: string[];

    /**
     * Dónde está cada tarjeta en el Inicio. Vive aquí y no en la base porque lo
     * decide el código de la app, igual que en Páginas de la App.
     */
    private readonly ubicaciones: Record<string, string> = {
        'nuevo-cada-semana': 'Destacado, arriba del todo',
        'beneficios': 'Explore libremente y Servicios Legacy (las dos tarjetas)',
        'miembros': 'Servicios Legacy',
        'legacy-test': 'Bloque final del Inicio',
        'lso-encabezado': 'Arriba de la pantalla, junto al botón de volver',
        'lso-banner': 'Primer recuadro, antes de los programas'
    };

    constructor(
        private seccionService: SeccionInicioAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        route: ActivatedRoute
    ) {
        this.pantalla = pantallaDe(route.snapshot.data['pantalla']) ?? 'inicio';
        this.displayedColumns = this.campos.imagen
            ? ['imagen', 'nombre', 'textos', 'donde', 'actualizada', 'acciones']
            : ['nombre', 'textos', 'donde', 'actualizada', 'acciones'];
    }

    get esInicio(): boolean {
        return this.pantalla === 'inicio';
    }

    get campos() {
        return CAMPOS_POR_PANTALLA[this.pantalla];
    }

    ngOnInit(): void {
        this.cargarSecciones();
    }

    cargarSecciones(): void {
        this.cargando.set(true);
        this.seccionService.listAll().subscribe({
            next: (data) => {
                this.todas.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las secciones', 'Cerrar', { duration: 4000 });
            }
        });
    }

    /** Lo que se ve en la app: lo del panel o, si está vacío, lo de siempre. */
    tituloDe(seccion: SeccionInicio): string {
        return seccion.titulo || TEXTOS_POR_DEFECTO[seccion.slug]?.titulo || seccion.nombre;
    }

    textoDe(seccion: SeccionInicio): string {
        return seccion.texto || TEXTOS_POR_DEFECTO[seccion.slug]?.texto || '';
    }

    ubicacionDe(seccion: SeccionInicio): string {
        return this.ubicaciones[seccion.slug] ?? (this.esInicio ? 'Explore libremente' : '—');
    }

    editar(seccion: SeccionInicio): void {
        const dialogRef = this.dialog.open(SeccionInicioDialogComponent, {
            width: '640px',
            data: { ...seccion }
        });

        dialogRef.afterClosed().subscribe(guardada => {
            if (guardada) {
                this.snackBar.open('Guardado', 'Cerrar', { duration: 3000 });
                this.cargarSecciones();
            }
        });
    }
}
