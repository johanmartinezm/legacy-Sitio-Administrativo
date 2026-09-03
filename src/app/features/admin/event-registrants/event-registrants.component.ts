import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EventService } from '../../../core/services/event.service';
import { EventRegistrant } from '../../../core/models/registrant.model';
import {
    DatosDeImportacion,
    ImportarUsuariosDialogComponent
} from '../importaciones/importar-usuarios-dialog/importar-usuarios-dialog.component';

/**
 * Lista de inscritos de un evento. Se llega desde "Administrar Eventos".
 *
 * Es una pantalla y no un dialogo como los de feedback y encuesta porque la
 * lista puede ser larga, se recorre buscando a alguien concreto y su URL se
 * puede compartir o dejar abierta en la puerta del evento.
 *
 * Desde aqui salen las dos mitades de la carga masiva de asistentes
 * (`reports/20260826_plan_carga_masiva.md` §4 A y §4.1): el boton que importa el
 * archivo, y la accion que genera las credenciales que ese archivo pudo dejar
 * sin crear.
 */
@Component({
    selector: 'app-event-registrants',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './event-registrants.component.html',
    styleUrls: ['./event-registrants.component.scss']
})
export class EventRegistrantsComponent implements OnInit {
    displayedColumns = ['name', 'contact', 'payment', 'status', 'credencial', 'attendance', 'date'];

    eventId = '';
    eventTitle = signal('');
    /**
     * Modalidad del evento. Manda sobre todo lo demas: un evento virtual no usa
     * QR en absoluto, asi que ni se importa con credencial ni se genera despues.
     */
    eventIsVirtual = signal(false);
    registrants = signal<EventRegistrant[]>([]);
    isLoading = signal(true);
    errorMessage = signal<string | null>(null);
    filtro = signal('');
    /** True mientras se generan credenciales, para no dejar pulsar dos veces. */
    generando = signal(false);

    /**
     * El filtro se aplica en el cliente sobre la lista completa.
     *
     * El endpoint pagina desde el 2026-08-26, pero esta pantalla pide todas las
     * paginas (`getAllEventRegistrants`) justamente para que el filtro y los
     * totales sigan siendo correctos: buscar solo en la pagina visible diria
     * "no esta" de alguien que si esta, y `recaudado` mostraria una fraccion.
     *
     * Buscar en el servidor no es posible hoy: el nombre, el correo y el
     * telefono estan cifrados en la base.
     */
    filtrados = computed(() => {
        const texto = this.filtro().trim().toLowerCase();
        if (!texto) return this.registrants();
        return this.registrants().filter(r =>
            r.fullName.toLowerCase().includes(texto) ||
            r.email.toLowerCase().includes(texto) ||
            r.phone.toLowerCase().includes(texto)
        );
    });

    total = computed(() => this.registrants().length);
    confirmados = computed(() => this.registrants().filter(r => r.registrationStatus === 'confirmed').length);
    pendientes = computed(() => this.registrants().filter(r => r.registrationStatus === 'pending_payment').length);
    asistieron = computed(() => this.registrants().filter(r => r.attendanceConfirmed).length);

    /**
     * A cuanta gente le falta la credencial y podria tenerla.
     *
     * Se excluye a quien esta pendiente de pago: esa inscripcion no da derecho a
     * entrar, asi que no es una credencial que falte, es una que no toca.
     *
     * Es el numero que importa antes de abrir puertas si hubo una carga masiva:
     * sin esto, el que se entera es quien esta en la entrada el dia del evento.
     */
    sinCredencial = computed(() =>
        this.eventIsVirtual()
            ? 0
            : this.registrants().filter(r =>
                !r.tieneCredencial && r.registrationStatus !== 'pending_payment'
            ).length
    );

    /** Lo recaudado de verdad: lo pendiente de pago no ha entrado en caja. */
    recaudado = computed(() =>
        this.registrants()
            .filter(r => r.registrationStatus === 'confirmed')
            .reduce((suma, r) => suma + (r.totalPaid || 0), 0)
    );

    constructor(
        private route: ActivatedRoute,
        private eventService: EventService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.eventId = this.route.snapshot.paramMap.get('id') || '';
        if (!this.eventId) {
            this.errorMessage.set('No se indico el evento.');
            this.isLoading.set(false);
            return;
        }

        // El titulo se pide aparte: el listado de inscritos no lo trae, y una
        // pantalla que solo dijera "Inscritos" obliga a volver atras para saber
        // de que evento se esta hablando. De la misma llamada sale la modalidad,
        // que es lo que decide si la credencial tiene sentido.
        this.eventService.getEventById(this.eventId).subscribe({
            next: (evento) => {
                this.eventTitle.set(evento.title);
                this.eventIsVirtual.set(!!evento.isVirtual);
            },
            error: () => this.eventTitle.set('')
        });

        this.cargarInscritos();
    }

    /**
     * Carga masiva al evento de esta pantalla. El evento lo fija la URL, no el
     * archivo: la columna «Ticket» ni se lee.
     */
    abrirImportacion(): void {
        const datos: DatosDeImportacion = {
            eventoId: this.eventId,
            tituloEvento: this.eventTitle(),
            esVirtual: this.eventIsVirtual()
        };

        const ref = this.dialog.open(ImportarUsuariosDialogComponent, {
            width: '900px',
            maxHeight: '90vh',
            disableClose: true,
            data: datos
        });

        // Al terminar se recarga la tabla y la gente ya esta ahi: no hay que ir
        // a otra pantalla a rematar.
        ref.afterClosed().subscribe(seEscribio => {
            if (seEscribio) {
                this.cargarInscritos();
            }
        });
    }

    /**
     * Rellena el codigo de acceso que falta.
     *
     * Sin `registrant` alcanza a todos los que les falte; con uno, solo a esa
     * persona. Es la misma llamada, asi que el boton de la fila y el de arriba
     * no pueden divergir.
     *
     * Se avisa siempre por correo: generar la credencial y entregarla son la
     * misma cosa —crear el codigo y que nadie se lo diga no sirve de nada—.
     */
    generarCredenciales(registrant?: EventRegistrant): void {
        const ids = registrant ? [registrant.registrationId] : [];
        this.generando.set(true);

        this.eventService.generarCredenciales(this.eventId, ids, true).subscribe({
            next: ({ generadas }) => {
                this.generando.set(false);
                this.snackBar.open(
                    generadas === 0
                        ? 'No habia ninguna credencial que generar.'
                        : `${generadas} credencial(es) generada(s) y enviada(s) por correo.`,
                    'Cerrar',
                    { duration: 5000 }
                );
                if (generadas > 0) {
                    this.cargarInscritos();
                }
            },
            error: (err) => {
                this.generando.set(false);
                // El backend responde texto plano: el 409 del evento virtual
                // explica por que no tiene sentido, y mostrarlo tal cual evita
                // un mensaje generico que no dice nada.
                const detalle = typeof err?.error === 'string' ? err.error.trim() : '';
                this.snackBar.open(
                    detalle || 'No se pudieron generar las credenciales.',
                    'Cerrar',
                    { duration: 6000 }
                );
            }
        });
    }

    /** Etiqueta legible del estado de la inscripcion. */
    estadoTexto(r: EventRegistrant): string {
        return r.registrationStatus === 'pending_payment' ? 'Pendiente de pago' : 'Confirmada';
    }

    pagoTexto(r: EventRegistrant): string {
        switch (r.paymentStatus) {
            case 'paid': return 'Pagado';
            case 'free': return 'Gratuito';
            case 'pending': return 'Pendiente';
            default: return r.paymentStatus || '—';
        }
    }

    /** Si a esa fila se le puede generar la credencial ahora mismo. */
    puedeGenerar(r: EventRegistrant): boolean {
        return !this.eventIsVirtual()
            && !r.tieneCredencial
            && r.registrationStatus !== 'pending_payment'
            && !this.generando();
    }

    private cargarInscritos(): void {
        this.isLoading.set(true);
        // Se piden **todos** los inscritos, no una página: esta pantalla busca
        // por nombre y correo —cifrados en la base, así que el servidor no
        // puede buscarlos— y calcula los totales, incluido lo recaudado. Con
        // una página, esa cifra mostraría una fracción sin avisar. El servicio
        // recorre páginas por dentro, así que ninguna consulta pide más de 200
        // filas de golpe.
        this.eventService.getAllEventRegistrants(this.eventId).subscribe({
            next: (lista) => {
                this.registrants.set(lista);
                this.errorMessage.set(null);
                this.isLoading.set(false);
            },
            error: (err) => {
                // La ruta es AdminOnly, asi que un 403 significa que se entro
                // con un token que no es de administrador. Decirlo evita buscar
                // el problema en el sitio equivocado.
                this.errorMessage.set(err?.status === 403
                    ? 'Esta informacion es solo para administradores.'
                    : 'No se pudo cargar la lista de inscritos. Intenta de nuevo.');
                this.isLoading.set(false);
            }
        });
    }
}
