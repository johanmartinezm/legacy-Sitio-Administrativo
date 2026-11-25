/**
 * Una opción de una de las listas de los formularios de Legacy Board: el A
 * (postulación del consejero) y el B (solicitud del empresario o la familia).
 * Las respuestas guardan el id, no el texto: renombrar una opción no cambia lo
 * ya enviado más que en cómo se lee. No se borran, se desactivan.
 */
export interface OpcionBoard {
    id?: string;
    catalogo: string;
    /** Clave estable que pone el backend al crearla; no se edita. */
    codigo?: string;
    etiqueta: string;
    orden: number;
    activo: boolean;
    creado_en?: string;
    actualizado_en?: string;
}

/** Uno de los 18 catálogos (domain.CatalogosBoard en el backend). */
export interface CatalogoBoard {
    clave: string;
    nombre: string;
    /** En qué formulario sale: 'A', 'B' o 'AB'. */
    formularios: 'A' | 'B' | 'AB';
    /** Si alimenta el cruce entre consejeros y empresarios. */
    matching: boolean;
    total: number;
    activas: number;
}

/** Límite del backend (board_opcion_service.go). */
export const MAX_ETIQUETA_OPCION_BOARD = 120;

/** Cómo se lee `formularios` en el panel. */
export const TEXTO_FORMULARIOS: Record<CatalogoBoard['formularios'], string> = {
    A: 'Consejero',
    B: 'Empresario',
    AB: 'Consejero y empresario'
};
