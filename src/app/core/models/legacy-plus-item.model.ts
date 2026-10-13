/**
 * Un punto con check de la pantalla Legacy+ de la app. Administrable desde el
 * panel desde el 2026-10-13.
 */
export interface LegacyPlusItem {
    id?: string;
    /** «incluye» (bajo «Tiene acceso a:») o «beneficios» (bajo el subtítulo de beneficios). */
    grupo: 'incluye' | 'beneficios';
    titulo: string;
    texto: string;
    orden: number;
    activo: boolean;
    creado_en?: string;
    actualizado_en?: string;
}

/** Límites del backend (legacy_plus_item_service.go). */
export const MAX_TITULO_LEGACY_PLUS = 60;
export const MAX_TEXTO_LEGACY_PLUS = 500;

export const GRUPOS_LEGACY_PLUS: { valor: LegacyPlusItem['grupo']; nombre: string }[] = [
    { valor: 'incluye', nombre: 'Tiene acceso a' },
    { valor: 'beneficios', nombre: 'Beneficios' }
];

export function nombreGrupo(grupo: string): string {
    return GRUPOS_LEGACY_PLUS.find(g => g.valor === grupo)?.nombre ?? grupo;
}
