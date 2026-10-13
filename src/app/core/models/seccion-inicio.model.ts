/**
 * Una tarjeta del Inicio de la app con su imagen. El título, el texto y el
 * destino de la tarjeta viven en la app; aquí solo se elige la imagen.
 * `imagen_url` vacía = sin imagen: la app pinta la tarjeta con su icono.
 */
export interface SeccionInicio {
    slug: string;
    nombre: string;
    orden: number;
    imagen_url: string;
    actualizada_en?: string;
}
