/**
 * Denuncia de una persona sobre otra, hecha desde la app.
 *
 * Existe por la directriz 1.2 de Apple, que exige poder reportar y bloquear
 * desde la app. Estos reportes son la otra mitad: sin una bandeja que los
 * atienda, se recogen denuncias que nadie lee.
 *
 * Es distinta de los reportes de publicaciones de foro, que tienen su propia
 * pantalla: aquélla señala un mensaje concreto de un foro, y ésta a una persona,
 * normalmente por lo ocurrido en un chat privado.
 */
export interface UserReport {
  id: string;
  reporter_id: string;
  reported_id: string;

  /**
   * Nombres ya descifrados por el backend. Los datos personales se guardan
   * cifrados y el panel no tiene la clave, así que estos campos no se pueden
   * resolver aquí.
   */
  reporter_name: string;
  reported_name: string;

  /** Mensaje concreto que motivó el reporte, si vino de un chat. */
  message_id: string | null;

  reason: string;
  status: UserReportStatus;
  created_at: string;
}

export type UserReportStatus = 'pending' | 'reviewed' | 'dismissed';

export const USER_REPORT_STATUS_LABELS: Record<UserReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
};
