import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CandidatoBoard, DetalleEnvioBoard, TEXTO_ESTADO_BOARD } from '../../../../core/models/board-envio.model';
import { BoardBandejaAdminService } from '../../../../core/services/board_bandeja_admin.service';
import { ConfigService } from '../../../../core/services/config.service';
import { DecisionDialogComponent } from './decision-dialog.component';

/**
 * Un formulario de Legacy Board completo, para que el comité lo lea y decida.
 * Los campos confidenciales (documento, contactos, empresas) llevan una marca:
 * solo se ven aquí, nunca en la app ni en el correo del aviso.
 */
@Component({
    selector: 'app-envio-detalle',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
    templateUrl: './envio-detalle.component.html',
    styleUrls: ['./envio-detalle.component.scss']
})
export class EnvioDetalleComponent implements OnInit {
    readonly textoEstado = TEXTO_ESTADO_BOARD;

    /** Las filas de la tabla llegan sin tipo a la plantilla. */
    textoDe(estado: string): string {
        return TEXTO_ESTADO_BOARD[estado as keyof typeof TEXTO_ESTADO_BOARD] ?? estado;
    }
    envio = signal<DetalleEnvioBoard | null>(null);
    cargando = signal(true);
    guardando = signal(false);
    /** null: no aplica (no es una solicitud aprobada) o aún no llegó. */
    candidatos = signal<CandidatoBoard[] | null>(null);
    cargandoCandidatos = signal(false);
    private id = '';

    constructor(
        private bandeja: BoardBandejaAdminService,
        private config: ConfigService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Desde la lista de candidatos se abre el detalle de otro envío en la
        // misma ruta: hay que recargar con cada id, no solo al crear la página.
        this.route.paramMap.subscribe(p => {
            this.id = p.get('id') ?? '';
            this.cargar();
        });
    }

    private cargar(): void {
        this.cargando.set(true);
        this.envio.set(null);
        this.candidatos.set(null);
        this.bandeja.detalle(this.id).subscribe({
            next: d => {
                this.envio.set(d);
                this.cargando.set(false);
                this.cargarCandidatos();
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudo abrir el formulario', 'Cerrar', { duration: 4000 });
            }
        });
    }

    /** El matching es de solicitudes de empresarios aprobadas (decisión 2 del plan). */
    get conCandidatos(): boolean {
        const e = this.envio();
        return !!e && e.formulario === 'B' && e.estado === 'aprobada';
    }

    cargarCandidatos(): void {
        if (!this.conCandidatos) {
            this.candidatos.set(null);
            return;
        }
        this.cargandoCandidatos.set(true);
        this.bandeja.candidatos(this.id).subscribe({
            next: c => {
                this.candidatos.set(c);
                this.cargandoCandidatos.set(false);
            },
            error: () => {
                this.cargandoCandidatos.set(false);
                this.snackBar.open('No se pudieron calcular los candidatos', 'Cerrar', { duration: 4000 });
            }
        });
    }

    abrirCandidato(c: CandidatoBoard): void {
        this.router.navigate(['/admin/legacy-board/bandeja', c.envio_id]);
    }

    /** Las fotos llegan como /api/images/<nombre>, relativas a la API. */
    urlFoto(ruta: string): string {
        return ruta ? `${this.config.apiUrl}${ruta}` : '';
    }

    get foto(): string {
        return this.urlFoto(this.envio()?.foto_url ?? '');
    }

    decidir(decision: 'aprobada' | 'rechazada'): void {
        const e = this.envio();
        if (!e) return;
        this.dialog.open(DecisionDialogComponent, { width: '520px', data: { decision, nombre: e.nombre } })
            .afterClosed().subscribe(motivo => {
                if (motivo === undefined) return; // cancelado
                this.guardando.set(true);
                this.bandeja.cambiarEstado(e.id, decision, motivo).subscribe({
                    next: d => {
                        this.envio.set(d);
                        this.guardando.set(false);
                        this.cargarCandidatos();
                        this.snackBar.open(decision === 'aprobada' ? 'Aprobada: se le avisó a la persona' : 'Rechazada: se le avisó a la persona',
                            'Cerrar', { duration: 4000 });
                    },
                    error: err => {
                        this.guardando.set(false);
                        const detalle = typeof err?.error === 'string' && err.error.trim() ? err.error.trim() : 'No se pudo guardar la decisión';
                        this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
                    }
                });
            });
    }
}
