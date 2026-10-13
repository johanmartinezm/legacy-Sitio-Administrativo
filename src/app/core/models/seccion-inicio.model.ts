/**
 * Una tarjeta del Inicio de la app con su imagen, su título y su texto. El
 * destino de la tarjeta vive en la app; aquí solo se elige lo que se ve.
 *
 * Vacío significa «lo de siempre»: `imagen_url` vacía pinta la tarjeta con su
 * icono, y `titulo` o `texto` vacíos usan los que la app trae escritos.
 */
export interface SeccionInicio {
    slug: string;
    nombre: string;
    orden: number;
    /** Pantalla de la app: tarjetas del Inicio o LSO · Escuela. */
    pantalla: Pantalla;
    imagen_url: string;
    titulo: string;
    texto: string;
    actualizada_en?: string;
}

export type Pantalla = 'inicio' | 'lso';

/**
 * Qué se edita en cada pantalla. El Inicio lleva imagen, título y texto; LSO,
 * título y texto. Asesoría tuvo su propia página el 2026-10-13, retirada ese
 * mismo día al quitarse de la app el recuadro que editaba; la fila
 * `asesoria-banner` sigue en la base pero ninguna página la lista.
 */
export const CAMPOS_POR_PANTALLA: Record<Pantalla, { imagen: boolean; titulo: boolean; nombre: string }> = {
    inicio: { imagen: true, titulo: true, nombre: 'Tarjetas del Inicio' },
    lso: { imagen: false, titulo: true, nombre: 'Textos de LSO' }
};

/** Pantalla de una fila; null si no corresponde a ninguna página del panel. */
export function pantallaDe(valor: string | undefined | null): Pantalla | null {
    if (!valor || valor === 'inicio') return 'inicio';
    return valor === 'lso' ? 'lso' : null;
}

/** Lo que admite el PUT: el campo que no se manda se queda como está. */
export type CambiosSeccionInicio = Partial<Pick<SeccionInicio, 'imagen_url' | 'titulo' | 'texto'>>;

/** Límites del backend (seccion_inicio_service.go): la tarjeta es de ancho fijo. */
export const MAX_TITULO_SECCION = 60;
export const MAX_TEXTO_SECCION = 300;

/**
 * Título y texto que la app muestra cuando el panel los deja vacíos. Copia de
 * home_content_screen.dart y programs_screen.dart, solo para enseñarlos en el
 * formulario: si la app los cambia, aquí hay que actualizarlos a mano.
 */
export const TEXTOS_POR_DEFECTO: Record<string, { titulo: string; texto: string }> = {
    'nuevo-cada-semana': {
        titulo: 'Nuevo cada semana',
        texto: 'Cambia según el perfil: «Esta semana: video de conversaciones difíciles, evento familiar...»'
    },
    'legacy-board': { titulo: 'Legacy Board', texto: 'Gobierno corporativo para familias empresarias' },
    'legacy-knowledge': { titulo: 'Legacy Knowledge', texto: 'Artículos, podcast, videos y libros' },
    'eventos': { titulo: 'Eventos', texto: 'Masterclass virtual en vivo y Legacy Summit presencial' },
    'lso-escuela': { titulo: 'LSO · Escuela', texto: 'Programas de formación' },
    'asesorias': { titulo: 'Asesorías', texto: 'L&M · Aurum · Legacy Legal' },
    'beneficios': { titulo: 'Beneficios', texto: 'Próximamente' },
    'legacy-plus': { titulo: 'Legacy+', texto: 'Cómo accedo' },
    'contactenos': { titulo: 'Contáctenos', texto: 'Escríbenos si necesitas ayuda' },
    'miembros': { titulo: 'Miembros', texto: 'Comunidad del ecosistema Legacy' },
    'legacy-test': {
        titulo: 'Descubra las trampas de su familia empresaria',
        texto: 'Conteste gratis el diagnóstico del Modelo DINASTÍA. ¿Quiere profundizar? Conozca los niveles del Legacy Test.'
    },
    'lso-encabezado': {
        titulo: 'LSO · Legacy School of Ownership',
        texto: 'La escuela del propietario en LATAM'
    },
    'lso-banner': {
        titulo: 'Formación que los MBA no dan',
        texto: 'Programas para gobernar la empresa y proteger el patrimonio. Doble certificación LSO + EUDE ⭐, con contenido académico de Harvard Business Impact. Alumni LSO acceden a Legacy+ con precio especial.'
    }
};
