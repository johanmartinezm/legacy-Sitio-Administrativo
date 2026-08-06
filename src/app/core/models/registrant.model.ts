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
}
