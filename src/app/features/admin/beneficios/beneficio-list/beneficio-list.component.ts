import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Beneficio, TEXTOS_TIPO, TipoBeneficio } from '../../../../core/models/beneficio.model';
import { BeneficioAdminService } from '../../../../core/services/beneficio_admin.service';
import { BeneficioFormDialogComponent } from '../beneficio-form-dialog/beneficio-form-dialog.component';

/**
 * Sirve a dos páginas del panel, según `data.tipo` de la ruta: «Beneficios»
 * (admin/beneficios) y «Alianzas» (admin/alianzas). Van separadas para no
 * confundir al administrador (pedido del cliente), aunque comparten tabla.
 */
@Component({
    selector: 'app-beneficio-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './beneficio-list.component.html',
    styleUrls: ['./beneficio-list.component.scss']
})
export class BeneficioListComponent implements OnInit {
    readonly tipo: TipoBeneficio;
    readonly textos;
    private todos = signal<Beneficio[]>([]);
    beneficios = computed(() => this.todos().filter(b => b.tipo === this.tipo));
    cargando = signal(true);
    displayedColumns = ['orden', 'imagen', 'contenido', 'enlace', 'estado', 'acciones'];

    constructor(
        private beneficioService: BeneficioAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        route: ActivatedRoute
    ) {
        this.tipo = route.snapshot.data['tipo'] === 'alianza' ? 'alianza' : 'beneficio';
        this.textos = TEXTOS_TIPO[this.tipo];
    }

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.beneficioService.listAll().subscribe({
            next: (data) => {
                this.todos.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open(`No se pudieron cargar las ${this.textos.plural.toLowerCase()}`, 'Cerrar', { duration: 4000 });
            }
        });
    }

    abrir(beneficio?: Beneficio): void {
        const siguienteOrden = Math.max(0, ...this.beneficios().map(b => b.orden)) + 10;
        const dialogRef = this.dialog.open(BeneficioFormDialogComponent, {
            width: '640px',
            data: { beneficio: beneficio ? { ...beneficio } : null, tipo: this.tipo, siguienteOrden }
        });
        dialogRef.afterClosed().subscribe(guardado => {
            if (guardado) {
                this.snackBar.open('Guardado', 'Cerrar', { duration: 3000 });
                this.cargar();
            }
        });
    }

    borrar(beneficio: Beneficio): void {
        if (!confirm(`¿Eliminar «${beneficio.titulo}»? Si solo quiere ocultarlo, edítelo y desactívelo.`)) {
            return;
        }
        this.beneficioService.delete(beneficio.id!).subscribe({
            next: () => {
                this.snackBar.open('Eliminado', 'Cerrar', { duration: 3000 });
                this.cargar();
            },
            error: () => this.snackBar.open('No se pudo eliminar', 'Cerrar', { duration: 4000 })
        });
    }
}
