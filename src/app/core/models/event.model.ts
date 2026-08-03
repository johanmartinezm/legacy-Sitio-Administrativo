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
    speaker?: string;
    price: number;
    isFree: boolean;
    buttonText: string;
    actionStatus: string;
    attendeesLimit?: number;
    includes: string;
}
