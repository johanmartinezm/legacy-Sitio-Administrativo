/**
 * Encuesta general del evento. Es distinta de WorkshopRating: aquélla califica
 * cada taller por separado, ésta el evento completo, con una sola respuesta por
 * persona.
 */

export interface EventSurveyComment {
    comment: string;
    createdAt: Date;
}

/**
 * Resumen que devuelve GET /api/events/{id}/survey/summary.
 *
 * Los promedios son `number | null` a propósito, no `number`. Las preguntas
 * opcionales pueden no tener ni una sola respuesta, y ahí un 0 se leería como
 * "pésimo" en vez de "sin datos": la plantilla tiene que poder distinguirlos.
 */
export interface EventSurveySummary {
    eventId: string;
    responses: number;
    overallAverage: number | null;
    organizationAverage: number | null;
    contentAverage: number | null;
    speakersAverage: number | null;
    /** Proporción de 0 a 1 de quienes recomendarían el evento. */
    recommendRate: number | null;
    comments: EventSurveyComment[];
}
