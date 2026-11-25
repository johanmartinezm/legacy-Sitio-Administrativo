import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogoBoard, OpcionBoard, TEXTO_FORMULARIOS } from '../../../../core/models/board-opcion.model';
import { BoardOpcionAdminService } from '../../../../core/services/board_opcion_admin.service';
import { OpcionFormDialogComponent } from '../opcion-form-dialog/opcion-form-dialog.component';

/**
 * Las listas de los formularios A y B de Legacy Board: un selector de catálogo,
 * la tabla de sus opciones y el diálogo para crear o editar una. El catálogo
 * elegido va en la URL (?catalogo=) para que recargar no lo pierda.
 */
@Component({
    selector: 'app-catalogo-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './catalogo-list.component.html',
    styleUrls: ['./catalogo-list.component.scss']
})
export class CatalogoListComponent implements OnInit {
    readonly textoFormularios = TEXTO_FORMULARIOS;
    catalogos = signal<CatalogoBoard[]>([]);
    clave = signal<string>('');
    catalogo = computed(() => this.catalogos().find(c => c.clave === this.clave()) ?? null);
    opciones = signal<OpcionBoard[]>([]);
    cargando = signal(true);
    /** Id de la opción cuyo interruptor se está guardando. */
    cambiando = signal<string | null>(null);
    displayedColumns = ['orden', 'etiqueta', 'codigo', 'activo', 'acciones'];

    constructor(
        private servicio: BoardOpcionAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.servicio.catalogos().subscribe({
            next: (data) => {
                this.catalogos.set(data);
                const pedida = this.route.snapshot.queryParamMap.get('catalogo');
                const inicial = data.find(c => c.clave === pedida) ?? data[0];
                if (inicial) {
                    this.elegir(inicial.clave);
                } else {
                    this.cargando.set(false);
                }
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las listas', 'Cerrar', { duration: 4000 });
            }
        });
    }

    elegir(clave: string): void {
        this.clave.set(clave);
        this.router.navigate([], { relativeTo: this.route, queryParams: { catalogo: clave }, replaceUrl: true });
        this.cargarOpciones();
    }

    cargarOpciones(): void {
        const clave = this.clave();
        this.cargando.set(true);
        this.servicio.opciones(clave).subscribe({
            next: (data) => {
                // Si se cambió de lista mientras llegaba la respuesta, esta ya no vale.
                if (clave !== this.clave()) {
                    return;
                }
                this.opciones.set(data);
                this.cargando.set(false);
                this.actualizarRecuento(clave, data);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar las opciones', 'Cerrar', { duration: 4000 });
            }
        });
    }

    /** Mantiene al día el «N de M activas» del selector sin volver a pedir las listas. */
    private actualizarRecuento(clave: string, opciones: OpcionBoard[]): void {
        this.catalogos.update(lista => lista.map(c => c.clave === clave
            ? { ...c, total: opciones.length, activas: opciones.filter(o => o.activo).length }
            : c));
    }

    abrir(opcion?: OpcionBoard): void {
        const catalogo = this.catalogo();
        if (!catalogo) {
            return;
        }
        // «Otro», «No aplica» y «Remoto» van en 990 o más: la nueva queda antes de ellas.
        const normales = this.opciones().filter(o => o.orden < 990).map(o => o.orden);
        const siguienteOrden = Math.max(0, ...normales) + 10;
        const dialogRef = this.dialog.open(OpcionFormDialogComponent, {
            width: '520px',
            data: { opcion: opcion ? { ...opcion } : null, catalogo, siguienteOrden }
        });
        dialogRef.afterClosed().subscribe(guardado => {
            if (guardado) {
                this.snackBar.open('Guardado', 'Cerrar', { duration: 3000 });
                this.cargarOpciones();
            }
        });
    }

    cambiarActivo(opcion: OpcionBoard, activo: boolean): void {
        this.cambiando.set(opcion.id!);
        this.servicio.update(opcion.id!, { etiqueta: opcion.etiqueta, orden: opcion.orden, activo }).subscribe({
            next: () => {
                this.cambiando.set(null);
                const texto = activo ? 'Opción activada' : 'Opción desactivada: ya no sale en la app';
                this.snackBar.open(texto, 'Cerrar', { duration: 3000 });
                this.cargarOpciones();
            },
            error: () => {
                this.cambiando.set(null);
                this.snackBar.open('No se pudo cambiar', 'Cerrar', { duration: 4000 });
                // Vuelve a pintar la tabla para devolver el interruptor a su sitio.
                this.opciones.update(lista => lista.map(o => ({ ...o })));
            }
        });
    }
}
