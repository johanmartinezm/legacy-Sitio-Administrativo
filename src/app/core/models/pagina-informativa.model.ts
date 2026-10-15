/**
 * Una página de información que edita el panel y pinta la app tal cual.
 *
 * No confundir con `pagina.ts`, que es la página de resultados de un listado.
 *
 * La identifica el `slug` y no un id: la app pide «legacy-board» por su nombre,
 * escrito en su propio código. Por eso el panel puede editarlas pero no crear
 * ni borrar: cada página tiene una pantalla que la muestra.
 */
export interface PaginaInformativa {
    slug: string;
    titulo: string;
    subtitulo: string;
    imagen_url: string;
    cuerpo: string;
    /** Si se apaga, la app responde 404 y la pantalla muestra su aviso. */
    publicada: boolean;
    actualizada_en?: string;
    /**
     * Pregunta y textos de los dos botones del pie. Vacío es «el de siempre»:
     * lo pone la app. Qué hace cada botón lo decide la app, no el panel.
     */
    pregunta_acciones?: string;
    boton_principal?: string;
    boton_secundario?: string;
}

/** Páginas que llevan botones al pie en la app: solo en ellas se editan. */
export const PAGINAS_CON_BOTONES = ['legacy-board'];

/** Límites del backend (pagina_service.go). */
export const MAX_PREGUNTA_ACCIONES = 80;
export const MAX_TEXTO_BOTON = 40;
