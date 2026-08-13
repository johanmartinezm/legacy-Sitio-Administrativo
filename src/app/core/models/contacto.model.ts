/**
 * Mensaje que alguien escribió desde la pantalla "Contáctenos" de la app.
 *
 * Antes estos mensajes solo se enviaban por correo y no quedaban en ninguna
 * parte: si el SMTP fallaba se perdían, y nadie podía revisar qué se había
 * preguntado. Ahora se guardan y esta bandeja es donde se atienden.
 */
export interface MensajeDeContacto {
  id: string;
  user_id: string;

  /**
   * Asunto y mensaje llegan ya descifrados desde el backend: se guardan
   * cifrados (AES-256) y el panel no tiene la clave.
   */
  asunto: string;
  mensaje: string;

  estado: EstadoContacto;

  /**
   * Si es false, el mensaje se guardó pero el correo al buzón de soporte no
   * salió. Es la única señal de que alguien escribió y nadie recibió el aviso,
   * así que la bandeja lo destaca.
   */
  email_enviado: boolean;

  created_at: string;
  updated_at: string;

  /** Datos de quien escribió, también descifrados por el backend. */
  remitente_nombre: string;
  remitente_email: string;
}

export type EstadoContacto = 'nuevo' | 'leido' | 'respondido';

export const ETIQUETAS_ESTADO_CONTACTO: Record<EstadoContacto, string> = {
  nuevo: 'Nuevo',
  leido: 'Leído',
  respondido: 'Respondido',
};
