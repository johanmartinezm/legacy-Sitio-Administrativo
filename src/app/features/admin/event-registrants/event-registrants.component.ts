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
import { EventService } from '../../../core/services/event.service';
import { EventRegistrant } from '../../../core/models/registrant.model';

/**
 * Lista de inscritos de un evento. Se llega desde "Administrar Eventos".
 *
 * Es una pantalla y no un dialogo como los de feedback y encuesta porque la
 * lista puede ser larga, se recorre buscando a alguien concreto y su URL se
 * puede compartir o dejar abierta en la puerta del evento.
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
    displayedColumns = ['name', 'contact', 'payment', 'status', 'attendance', 'date'];

    eventId = '';
    eventTitle = signal('');
    registrants = signal<EventRegistrant[]>([]);
    isLoading = signal(true);
    errorMessage = signal<string | null>(null);
    filtro = signal('');

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

    /** Lo recaudado de verdad: lo pendiente de pago no ha entrado en caja. */
    recaudado = computed(() =>
        this.registrants()
            .filter(r => r.registrationStatus === 'confirmed')
            .reduce((suma, r) => suma + (r.totalPaid || 0), 0)
    );

    constructor(
        private route: ActivatedRoute,
        private eventService: EventService
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
        // de que evento se esta hablando.
        this.eventService.getEventById(this.eventId).subscribe({
            next: (evento) => this.eventTitle.set(evento.title),
            error: () => this.eventTitle.set('')
        });

        // Se piden **todos** los inscritos, no una página: esta pantalla busca
        // por nombre y correo —cifrados en la base, así que el servidor no
        // puede buscarlos— y calcula los totales, incluido lo recaudado. Con
        // una página, esa cifra mostraría una fracción sin avisar. El servicio
        // recorre páginas por dentro, así que ninguna consulta pide más de 200
        // filas de golpe.
        this.eventService.getAllEventRegistrants(this.eventId).subscribe({
            next: (lista) => {
                this.registrants.set(lista);
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
}
