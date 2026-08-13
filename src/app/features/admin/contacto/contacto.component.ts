import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactoService } from '../../../core/services/contacto.service';
import {
  EstadoContacto,
  ETIQUETAS_ESTADO_CONTACTO,
  MensajeDeContacto,
} from '../../../core/models/contacto.model';

/**
 * Bandeja de "Contáctenos": los mensajes que la gente escribe desde la app.
 *
 * Antes solo llegaban por correo y no quedaban en ningún sitio. Aquí están
 * todos, incluidos los que el correo no logró entregar, que son justamente los
 * que nadie vería de otra forma.
 */
@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
})
export class ContactoComponent implements OnInit {
  mensajes: MensajeDeContacto[] = [];
  loading = true;
  error: string | null = null;

  /** Arranca en "nuevo": es lo que está sin atender. */
  filtro: EstadoContacto | 'all' = 'nuevo';

  /** Mensaje abierto. La lista muestra solo el asunto para poder recorrerla. */
  abierto: string | null = null;

  readonly etiquetas = ETIQUETAS_ESTADO_CONTACTO;

  constructor(private service: ContactoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = null;

    const estado = this.filtro === 'all' ? undefined : this.filtro;
    this.service.listar(estado).subscribe({
      next: (data) => {
        this.mensajes = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        // El 403 lleva su propio mensaje, como en el resto de pantallas de
        // administración: el genérico haría pensar que el servicio está caído.
        this.error =
          err?.status === 403
            ? 'Esta información es solo para administradores'
            : 'No se pudieron cargar los mensajes';
        this.loading = false;
      },
    });
  }

  cambiarFiltro(filtro: EstadoContacto | 'all'): void {
    this.filtro = filtro;
    this.abierto = null;
    this.cargar();
  }

  /** Abrir un mensaje nuevo lo marca como leído: es lo que acaba de pasar. */
  alternar(mensaje: MensajeDeContacto): void {
    const abriendo = this.abierto !== mensaje.id;
    this.abierto = abriendo ? mensaje.id : null;

    if (abriendo && mensaje.estado === 'nuevo') {
      this.marcar(mensaje, 'leido', false);
    }
  }

  marcar(mensaje: MensajeDeContacto, estado: EstadoContacto, recargar = true): void {
    const anterior = mensaje.estado;
    // Se pinta el estado nuevo antes de que responda el servidor para que la
    // lista no parpadee; si falla, se deja como estaba.
    mensaje.estado = estado;

    this.service.cambiarEstado(mensaje.id, estado).subscribe({
      next: () => {
        // Al filtrar por un estado, el mensaje que cambia deja de pertenecer a
        // la lista: recargar evita dejarlo ahí mintiendo.
        if (recargar && this.filtro !== 'all') {
          this.cargar();
        }
      },
      error: () => {
        mensaje.estado = anterior;
        this.error = 'No se pudo actualizar el estado';
      },
    });
  }

  /** Abre el cliente de correo con la respuesta empezada. */
  responder(mensaje: MensajeDeContacto): void {
    const asunto = encodeURIComponent(`Re: ${mensaje.asunto}`);
    window.location.href = `mailto:${mensaje.remitente_email}?subject=${asunto}`;
    this.marcar(mensaje, 'respondido');
  }
}
