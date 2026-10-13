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
    imagen_url: string;
    titulo: string;
    texto: string;
    actualizada_en?: string;
}

/** Lo que admite el PUT: el campo que no se manda se queda como está. */
export type CambiosSeccionInicio = Partial<Pick<SeccionInicio, 'imagen_url' | 'titulo' | 'texto'>>;

/** Límites del backend (seccion_inicio_service.go): la tarjeta es de ancho fijo. */
export const MAX_TITULO_SECCION = 60;
export const MAX_TEXTO_SECCION = 200;

/**
 * Título y texto que la app muestra cuando el panel los deja vacíos. Copia de
 * home_content_screen.dart, solo para enseñarlos en el formulario: si la app
 * los cambia, aquí hay que actualizarlos a mano.
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
    }
};
