export interface Workshop {
    id: string;
    name: string;
    description?: string;
    room: string;
    speaker: string; // Could be expanded to Speaker interface later
    imageUrl?: string;
    startDateTime: Date;
    endDateTime: Date;
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
    speaker?: string;
    price: number;
    isFree: boolean;
    buttonText: string;
    actionStatus: string;
    attendeesLimit?: number;
    includes: string;
}
