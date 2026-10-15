/**
 * Una unidad de la pantalla Asesoría de la app («NUESTRAS UNIDADES»).
 * Administrable desde el panel desde el 2026-10-13.
 */
export interface AsesoriaUnidad {
    id?: string;
    titulo: string;
    subtitulo: string;
    /** Clave de ICONOS_ASESORIA; la app la traduce a un icono. */
    icono: string;
    /** Icono o imagen subido; si está, la app lo pinta en lugar de `icono`. */
    imagen_url?: string;
    /** Opción de «¿Qué necesita?» que el formulario marca al entrar por esta unidad. */
    necesidad: string;
    orden: number;
    activa: boolean;
    creada_en?: string;
    actualizada_en?: string;
}

/** Límites del backend (asesoria_unidad_service.go). */
export const MAX_TITULO_UNIDAD = 60;
export const MAX_SUBTITULO_UNIDAD = 120;

/** Las opciones de «¿Qué necesita?» del formulario de la app. */
export const NECESIDADES_ASESORIA = [
    'Gobierno', 'Sucesión', 'Patrimonio', 'Legal/Tributario', 'Certificación', 'Otro'
];

/**
 * Iconos que la app sabe pintar: clave que se guarda → icono de Material
 * equivalente, para enseñarlo en el panel. La lista vive también en
 * domain/asesoria_unidad.go (backend) y asesoria_screen.dart (app).
 */
export const ICONOS_ASESORIA: { clave: string; icono: string; nombre: string }[] = [
    { clave: 'escudo', icono: 'verified_user', nombre: 'Escudo' },
    { clave: 'crecimiento', icono: 'trending_up', nombre: 'Crecimiento' },
    { clave: 'balanza', icono: 'balance', nombre: 'Balanza' },
    { clave: 'formacion', icono: 'school', nombre: 'Formación' },
    { clave: 'grupo', icono: 'groups', nombre: 'Grupo' },
    { clave: 'negocio', icono: 'business_center', nombre: 'Negocio' },
    { clave: 'familia', icono: 'family_restroom', nombre: 'Familia' },
    { clave: 'banco', icono: 'account_balance', nombre: 'Banco' },
    { clave: 'apreton', icono: 'handshake', nombre: 'Acuerdo' },
    { clave: 'mazo', icono: 'gavel', nombre: 'Legal' }
];

export function iconoMaterial(clave: string): string {
    return ICONOS_ASESORIA.find(i => i.clave === clave)?.icono ?? 'business_center';
}
