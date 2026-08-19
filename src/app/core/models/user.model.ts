// Los cuatro valores del enum core.user_role del backend. 'junta' se añadió el
// 2026-08-18 (Backend/scripts/20260818_add_junta_user_role.sql); sin él, el
// panel no sabía mostrar el rol de quien se registra por la tercera opción del
// onboarding de la app.
export type UserRole = 'familia' | 'empresa' | 'profesional' | 'junta';

export interface User {
    id: string;
    email: string;
    firstName: string; // Mapped from first_name
    lastName: string;  // Mapped from last_name
    birthDate?: string; // Mapped from birth_date
    role: UserRole;

    // Optional fields
    password?: string; // Only for creation/update
    phone?: string;
    location?: string;
    bio?: string;
    industry?: string;
    profileImageUrl?: string;
    generation?: string;
    companyName?: string; // Mapped from company_name
    jobTitle?: string;    // Mapped from job_title
    country?: string;
    identificationType?: string;
    identificationNumber?: string;
    customerStatus?: string;

    // Settings
    isPublicProfile?: boolean;
    allowMessagesFromStrangers?: boolean;
    showActivity?: boolean;

    isActive?: boolean;   // Mapped from is_active (using admins logic or custom field)
}
