export interface Workshop {
    id: string;
    name: string;
    description?: string;
    room: string;
    speaker: string; // Could be expanded to Speaker interface later
    imageUrl?: string;
    startDateTime: Date;
    endDateTime: Date;
    /** Material para después del workshop (parte A del plan de workshops). */
    material?: MaterialDeWorkshop;
}

/**
 * Una imagen, un archivo y un video por workshop. Vacío es «no hay». Se guarda
 * con su propia ruta: el PUT del workshop no lo envía, y si lo enviara cada
 * edición del workshop lo borraría.
 */
export interface MaterialDeWorkshop {
    /** URL absoluta, como la imagen del workshop. Es otra imagen, distinta. */
    imageUrl: string;
    /** Nombre en el servidor («<uuid>_<nombre>»); se descarga por /api/documents. */
    fileName: string;
    fileOriginalName: string;
    fileSize: number;
    /** Enlace de YouTube o de Vimeo. */
    videoUrl: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    orderIndex: number;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    categoryId: string;
    workshops: Workshop[];
    startDate?: Date;
    endDate?: Date;
    location?: string;
    /** true = masterclass virtual en vivo; false = presencial. Decide si la
     *  inscripción recibe QR de acceso o el enlace de la sesión. */
    isVirtual?: boolean;
    /** Enlace de la sesión, solo en los virtuales. */
    accessUrl?: string | null;
    /**
     * Link de pago externo (parte B del plan de workshops). Obligatorio, https,
     * en todo evento que no sea gratuito: quien se inscribe queda pendiente,
     * paga por ahí, y se aprueba desde «Inscritos».
     */
    paymentUrl?: string | null;
    speaker?: string;
    price: number;
    isFree: boolean;
    buttonText: string;
    actionStatus: string;
    attendeesLimit?: number;
    includes: string;
    /** Modelo de trabajo del evento (p. ej. «7 dimensiones DINASTÍA»).
     *  Opcional: si queda vacío la app no muestra la fila. */
    model?: string | null;
    /** 'active' = se ve en la app; 'inactive' = solo se ve aquí, en el panel.
     *  Es de solo lectura desde el formulario: cambiarlo va por su propia
     *  llamada (EventService.updateStatus), porque el PUT del evento no
     *  escribe este campo. */
    status?: string;
}
