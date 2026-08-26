import { PAISES_LATAM, tiposIdentificacionPara, tiposConValorActual } from './identificacion';

/**
 * El catálogo es espejo del de la app. Lo que estas pruebas protegen no es la
 * lista en sí, sino la propiedad que se rompió: que el valor guardado por la app
 * tenga siempre una opción que lo represente en el panel. Sin eso el desplegable
 * sale vacío y el primer guardado borra el dato.
 */
describe('catálogo de identificación', () => {
    it('ofrece los diecisiete países más "Otro"', () => {
        expect(PAISES_LATAM.length).toBe(18);
        expect(PAISES_LATAM[0]).toBe('Colombia');
        expect(PAISES_LATAM[PAISES_LATAM.length - 1]).toBe('Otro');
    });

    it('Colombia usa los nombres largos que guarda la app, no las siglas', () => {
        const tipos = tiposIdentificacionPara('Colombia');
        expect(tipos).toContain('Cédula');
        expect(tipos).toContain('Cédula de extranjería');
        // Las siglas del panel viejo no coincidían con nada de la app.
        expect(tipos).not.toContain('CC');
        expect(tipos).not.toContain('CE');
    });

    it('cada país trae su documento tributario propio', () => {
        expect(tiposIdentificacionPara('México')).toContain('RFC');
        expect(tiposIdentificacionPara('Perú')).toContain('RUC');
        expect(tiposIdentificacionPara('Chile')).toContain('RUT');
        expect(tiposIdentificacionPara('Argentina')).toContain('CUIT');
    });

    it('un país desconocido cae en el genérico en vez de quedarse vacío', () => {
        expect(tiposIdentificacionPara('Otro')).toEqual(['Pasaporte', 'Documento extranjero', 'Otro']);
        expect(tiposIdentificacionPara('Japón')).toEqual(['Pasaporte', 'Documento extranjero', 'Otro']);
    });

    describe('valores antiguos guardados en producción', () => {
        it('conserva el valor aunque ya no esté en el catálogo', () => {
            // Cuentas creadas desde el panel antes de unificar el catálogo.
            expect(tiposConValorActual('Colombia', 'CC')).toContain('CC');
            expect(tiposConValorActual('Otro', 'ID Extranjero')).toContain('ID Extranjero');
        });

        it('no duplica el valor cuando sí está en el catálogo', () => {
            const tipos = tiposConValorActual('Colombia', 'Cédula');
            expect(tipos.filter((t) => t === 'Cédula').length).toBe(1);
        });

        it('sin valor guardado devuelve el catálogo tal cual', () => {
            expect(tiposConValorActual('Colombia', null)).toEqual(tiposIdentificacionPara('Colombia'));
            expect(tiposConValorActual('Colombia', '')).toEqual(tiposIdentificacionPara('Colombia'));
        });
    });

    it('todo tipo que ofrece un país se representa a sí mismo', () => {
        // La propiedad que importa: si la app guardó lo que el catálogo ofrece,
        // el panel siempre encuentra su opción.
        for (const pais of PAISES_LATAM) {
            for (const tipo of tiposIdentificacionPara(pais)) {
                expect(tiposConValorActual(pais, tipo)).toContain(tipo);
            }
        }
    });
});
