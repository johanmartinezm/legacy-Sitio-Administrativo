/**
 * Una tarjeta de la sección Beneficios de la app (solo usuarios Legacy+): un
 * beneficio o una alianza, cada tipo en su slider y en su página del panel.
 */
export interface Beneficio {
    id?: string;
    tipo: TipoBeneficio;
    titulo: string;
    descripcion: string;
    imagen_url: string;
    enlace_url: string;
    orden: number;
    activo: boolean;
    creado_en?: string;
    actualizado_en?: string;
}

export type TipoBeneficio = 'beneficio' | 'alianza';

/** Límites del backend (beneficio_service.go). */
export const MAX_TITULO_BENEFICIO = 80;
export const MAX_DESCRIPCION_BENEFICIO = 500;

/** Cómo se nombra cada tipo en su página del panel. */
export const TEXTOS_TIPO: Record<TipoBeneficio, { plural: string; singular: string; nuevo: string }> = {
    beneficio: { plural: 'Beneficios', singular: 'beneficio', nuevo: 'Nuevo beneficio' },
    alianza: { plural: 'Alianzas', singular: 'alianza', nuevo: 'Nueva alianza' }
};
