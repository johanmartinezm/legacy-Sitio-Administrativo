/**
 * Un inscrito en un evento, tal como lo devuelve
 * GET /api/events/{id}/registrations (bajo AdminOnly).
 *
 * El backend descifra el nombre y el correo antes de responder: aquí llegan
 * ya legibles. No incluye el qrData a propósito — quien organiza necesita
 * saber quién viene y quién debe, no repartir credenciales de entrada.
 */
export interface EventRegistrant {
    registrationId: string;
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    /** 'paid' | 'pending' | 'free' */
    paymentStatus: string;
    /** 'confirmed' | 'pending_payment' */
    registrationStatus: string;
    registrationDate: Date;
    totalPaid: number;
    attendanceConfirmed: boolean;
    /**
     * Si esa inscripción tiene código de acceso — no cuál es: el `qrData` sigue
     * sin salir del backend, por lo mismo de siempre.
     *
     * Lo trae porque una carga masiva puede dejar gente sin credencial (el
     * interruptor de `reports/20260826_plan_carga_masiva.md` §4.1), y sin verlo
     * en la tabla el que se entera es quien está en la puerta el día del evento.
     */
    tieneCredencial: boolean;
}
