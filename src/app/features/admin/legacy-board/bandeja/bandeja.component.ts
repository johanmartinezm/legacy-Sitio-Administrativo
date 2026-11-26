import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
    EstadoEnvioBoard,
    FORMULARIOS_BOARD,
    ResumenEnvioBoard,
    TEXTO_ESTADO_BOARD
} from '../../../../core/models/board-envio.model';
import { OpcionBoard } from '../../../../core/models/board-opcion.model';
import { BoardBandejaAdminService } from '../../../../core/services/board_bandeja_admin.service';
import { BoardOpcionAdminService } from '../../../../core/services/board_opcion_admin.service';

/**
 * Bandeja de Legacy Board: los formularios que llegan desde la app, para que
 * el comité los revise uno por uno. Arriba, quién recibe el correo de cada
 * envío nuevo. Lo cifrado (nombre, documento…) no se puede filtrar en el
 * servidor, así que los filtros son estado, fecha, sector y expertise.
 */
@Component({
    selector: 'app-bandeja-board',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatTableModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        MatPaginatorModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './bandeja.component.html',
    styleUrls: ['./bandeja.component.scss']
})
export class BandejaBoardComponent implements OnInit {
    readonly formularios = FORMULARIOS_BOARD;
    readonly textoEstado = TEXTO_ESTADO_BOARD;

    /** Las filas de la tabla llegan sin tipo a la plantilla. */
    textoDe(estado: string): string {
        return TEXTO_ESTADO_BOARD[estado as keyof typeof TEXTO_ESTADO_BOARD] ?? estado;
    }
    readonly separadores = [ENTER, COMMA];
    readonly tamanosDePagina = [25, 50, 100];
    displayedColumns = ['fecha', 'nombre', 'estado', 'aviso'];

    // Filtros
    formulario = FORMULARIOS_BOARD[0].clave;
    estado: EstadoEnvioBoard | '' = 'pendiente';
    desde = '';
    hasta = '';
    sector = '';
    expertise = '';
    sectores = signal<OpcionBoard[]>([]);
    areas = signal<OpcionBoard[]>([]);

    // Lista
    envios = signal<ResumenEnvioBoard[]>([]);
    total = signal(0);
    cargando = signal(true);
    pagina = 0;
    tamanoDePagina = 25;

    // Destinatarios del aviso
    destinatarios = signal<string[]>([]);
    destinatariosGuardados = signal<string[]>([]);
    guardandoDestinatarios = signal(false);

    constructor(
        private bandeja: BoardBandejaAdminService,
        private opciones: BoardOpcionAdminService,
        private snackBar: MatSnackBar,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.opciones.opciones('sector').subscribe(o => this.sectores.set(o));
        this.opciones.opciones('expertise').subscribe(o => this.areas.set(o));
        this.bandeja.destinatarios().subscribe({
            next: c => {
                this.destinatarios.set(c);
                this.destinatariosGuardados.set(c);
            },
            error: () => this.snackBar.open('No se pudieron cargar los destinatarios', 'Cerrar', { duration: 4000 })
        });
        this.cargar();
    }

    /** Un filtro nuevo vuelve a la primera página. */
    filtrar(): void {
        this.pagina = 0;
        this.cargar();
    }

    /** Sector y expertise no se combinan: el backend filtra por una opción. */
    elegirArea(tipo: 'sector' | 'expertise', valor: string): void {
        if (tipo === 'sector') {
            this.sector = valor;
            if (valor) this.expertise = '';
        } else {
            this.expertise = valor;
            if (valor) this.sector = '';
        }
        this.filtrar();
    }

    limpiar(): void {
        this.estado = '';
        this.desde = '';
        this.hasta = '';
        this.sector = '';
        this.expertise = '';
        this.filtrar();
    }

    cargar(): void {
        this.cargando.set(true);
        const filtro = {
            formulario: this.formulario,
            estado: this.estado || undefined,
            desde: this.desde || undefined,
            hasta: this.hasta || undefined,
            filtro: this.sector ? 'sector' as const : this.expertise ? 'expertise' as const : undefined,
            opcion: this.sector || this.expertise || undefined
        };
        this.bandeja.listar(filtro, this.tamanoDePagina, this.pagina * this.tamanoDePagina).subscribe({
            next: p => {
                this.envios.set(p.items);
                this.total.set(p.total);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudo cargar la bandeja', 'Cerrar', { duration: 4000 });
            }
        });
    }

    cambiarPagina(evento: PageEvent): void {
        this.pagina = evento.pageIndex;
        this.tamanoDePagina = evento.pageSize;
        this.cargar();
    }

    abrir(envio: ResumenEnvioBoard): void {
        this.router.navigate(['/admin/legacy-board/bandeja', envio.id]);
    }

    // --- Destinatarios ---

    agregarDestinatario(evento: MatChipInputEvent): void {
        const correo = (evento.value || '').trim().toLowerCase();
        if (correo && !this.destinatarios().includes(correo)) {
            this.destinatarios.update(l => [...l, correo]);
        }
        evento.chipInput.clear();
    }

    quitarDestinatario(correo: string): void {
        this.destinatarios.update(l => l.filter(c => c !== correo));
    }

    get destinatariosCambiados(): boolean {
        return this.destinatarios().join(',') !== this.destinatariosGuardados().join(',');
    }

    guardarDestinatarios(): void {
        this.guardandoDestinatarios.set(true);
        this.bandeja.guardarDestinatarios(this.destinatarios()).subscribe({
            next: c => {
                this.destinatarios.set(c);
                this.destinatariosGuardados.set(c);
                this.guardandoDestinatarios.set(false);
                this.snackBar.open('Destinatarios guardados', 'Cerrar', { duration: 3000 });
            },
            error: err => {
                this.guardandoDestinatarios.set(false);
                const detalle = typeof err?.error === 'string' && err.error.trim() ? err.error.trim() : 'No se pudieron guardar';
                this.snackBar.open(detalle, 'Cerrar', { duration: 5000 });
            }
        });
    }
}
