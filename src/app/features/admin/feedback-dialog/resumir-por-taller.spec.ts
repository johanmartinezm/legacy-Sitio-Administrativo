import { resumirPorTaller } from './feedback-dialog.component';
import { WorkshopRating } from '../../../core/models/rating.model';

/**
 * Promedio por taller en el feedback de un evento. Hasta el 2026-10-28 solo
 * había el del evento, que no dice qué taller gustó y cuál no.
 */
describe('resumirPorTaller', () => {
    const calificacion = (workshopId: string, workshopName: string, rating: number): WorkshopRating => ({
        id: Math.random().toString(),
        workshopId,
        workshopName,
        userId: 'u',
        rating,
        comment: '',
        createdAt: new Date()
    });

    it('promedia cada taller y ordena de mejor a peor', () => {
        const resumen = resumirPorTaller([
            calificacion('a', 'Sucesión', 3),
            calificacion('b', 'Gobierno', 5),
            calificacion('a', 'Sucesión', 4),
            calificacion('b', 'Gobierno', 4)
        ]);

        expect(resumen).toEqual([
            { nombre: 'Gobierno', promedio: 4.5, cantidad: 2 },
            { nombre: 'Sucesión', promedio: 3.5, cantidad: 2 }
        ]);
    });

    it('separa por id dos talleres con el mismo nombre', () => {
        const resumen = resumirPorTaller([
            calificacion('a', 'Panel', 5),
            calificacion('b', 'Panel', 1)
        ]);

        expect(resumen.length).toBe(2);
    });

    it('sin calificaciones devuelve una lista vacía', () => {
        expect(resumirPorTaller([])).toEqual([]);
    });
});
