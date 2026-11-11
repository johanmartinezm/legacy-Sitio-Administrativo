import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Banner } from '../../../../core/models/banner.model';
import { BannerAdminService } from '../../../../core/services/banner_admin.service';
import { BannerFormDialogComponent } from '../banner-form-dialog/banner-form-dialog.component';
import { SeccionInicioAdminService } from '../../../../core/services/seccion_inicio_admin.service';
import { SLUG_CARRUSEL_INICIO } from '../../../../core/models/seccion-inicio.model';

@Component({
    selector: 'app-banner-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatSlideToggleModule
    ],
    templateUrl: './banner-list.component.html',
    styleUrls: ['./banner-list.component.scss']
})
export class BannerListComponent implements OnInit {
    banners = signal<Banner[]>([]);
    displayedColumns: string[] = ['image', 'title', 'category', 'order', 'status', 'actions'];

    /**
     * Si la app muestra el carrusel de banners del Inicio. `null` mientras
     * carga, o si el backend no tiene aún la fila (entonces no se muestra el
     * interruptor: cambiarlo daría 404).
     */
    carruselInicioVisible = signal<boolean | null>(null);
    guardandoCarrusel = signal(false);

    constructor(
        private bannerService: BannerAdminService,
        private seccionesService: SeccionInicioAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadBanners();
        this.cargarCarruselInicio();
    }

    cargarCarruselInicio(): void {
        this.seccionesService.listAll().subscribe({
            next: (secciones) => {
                const fila = secciones.find(s => s.slug === SLUG_CARRUSEL_INICIO);
                this.carruselInicioVisible.set(fila ? fila.visible !== false : null);
            },
            error: () => this.carruselInicioVisible.set(null)
        });
    }

    /** Se guarda al momento, sin botón: es un interruptor de toda la pantalla. */
    cambiarCarruselInicio(evento: MatSlideToggleChange): void {
        const visible = evento.checked;
        this.guardandoCarrusel.set(true);
        this.seccionesService.actualizar(SLUG_CARRUSEL_INICIO, { visible }).subscribe({
            next: (fila) => {
                this.guardandoCarrusel.set(false);
                this.carruselInicioVisible.set(fila.visible !== false);
                this.snackBar.open(
                    visible ? 'El carrusel se muestra en el Inicio de la app' : 'El carrusel ya no se muestra en el Inicio de la app',
                    'Cerrar', { duration: 3000 });
            },
            error: () => {
                this.guardandoCarrusel.set(false);
                // Vuelve a como estaba: el interruptor no puede quedar
                // diciendo algo que no se guardó.
                evento.source.checked = !visible;
                this.snackBar.open('No se pudo guardar. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
            }
        });
    }

    loadBanners(): void {
        this.bannerService.listAll().subscribe({
            next: (data) => this.banners.set(data),
            error: (err) => this.snackBar.open('Error al cargar banners', 'Cerrar', { duration: 3000 })
        });
    }

    openBannerDialog(banner?: Banner): void {
        const dialogRef = this.dialog.open(BannerFormDialogComponent, {
            width: '600px',
            data: banner ? { ...banner } : null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadBanners();
            }
        });
    }

    deleteBanner(banner: Banner): void {
        if (confirm(`¿Estás seguro de eliminar el banner "${banner.title}"?`)) {
            this.bannerService.delete(banner.id!).subscribe({
                next: () => {
                    this.snackBar.open('Banner eliminado', 'Cerrar', { duration: 3000 });
                    this.loadBanners();
                },
                error: () => this.snackBar.open('Error al eliminar banner', 'Cerrar', { duration: 3000 })
            });
        }
    }
}
