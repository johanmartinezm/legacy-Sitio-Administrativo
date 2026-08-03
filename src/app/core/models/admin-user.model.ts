export interface AdminUser {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    password?: string; // used for registration
    createdAt?: Date;
    updatedAt?: Date;
}
