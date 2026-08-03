export interface WorkshopRating {
    id: string;
    workshopId: string;
    workshopName: string;
    userId: string;
    rating: number;
    comment: string;
    createdAt: Date;
}
