/**
 * Un formulario de Legacy Board enviado desde la app: la postulación del
 * consejero (A) o la solicitud del empresario (B). Los datos personales llegan
 * descifrados: el backend solo los da al panel.
 */
export type EstadoEnvioBoard = 'pendiente' | 'aprobada' | 'rechazada';

export interface ResumenEnvioBoard {
    id: string;
    formulario: string;
    nombre: string;
    correo: string;
    estado: EstadoEnvioBoard;
    /** false: el correo a los destinatarios no salió. */
    aviso_enviado: boolean;
    creado_en: string;
    estado_cambiado_en?: string;
}

export interface RespuestaLegibleBoard {
    clave: string;
    etiqueta: string;
    tipo: string;
    valor: string;
    valores?: string[];
    confidencial: boolean;
}

export interface DetalleEnvioBoard extends ResumenEnvioBoard {
    titulo: string;
    user_id: string;
    foto_url: string;
    estado_motivo: string;
    estado_cambiado_por: string;
    secciones: { titulo: string; respuestas: RespuestaLegibleBoard[] }[];
}

export interface FiltroBandejaBoard {
    formulario: string;
    estado?: EstadoEnvioBoard;
    /** AAAA-MM-DD */
    desde?: string;
    hasta?: string;
    /** «sector» o «expertise», con el id de la opción. */
    filtro?: 'sector' | 'expertise';
    opcion?: string;
}

export const TEXTO_ESTADO_BOARD: Record<EstadoEnvioBoard, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada'
};

/** Los formularios que la bandeja ofrece. */
export const FORMULARIOS_BOARD = [
    { clave: 'A', nombre: 'Postulaciones de consejeros' },
    { clave: 'B', nombre: 'Solicitudes de empresarios' }
];

/** Límite del backend (board_bandeja_service.go). */
export const MAX_MOTIVO_BOARD = 1000;

/**
 * Un consejero aprobado cruzado con una solicitud aprobada (matching, §8).
 * Determinista: mismos datos, mismo resultado.
 */
export interface CandidatoBoard {
    envio_id: string;
    nombre: string;
    foto_url: string;
    cargo_actual: string;
    /** 0 a 100. */
    porcentaje: number;
    razones: string[];
    /** No puntúa: se muestra para compararlo con el presupuesto. */
    honorarios: string;
}
