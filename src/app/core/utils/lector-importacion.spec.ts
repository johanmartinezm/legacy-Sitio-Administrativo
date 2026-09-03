import * as XLSX from 'xlsx';

import { leerArchivoDeAsistentes } from './lector-importacion';

/**
 * Lo que protegen estas pruebas son las dos cosas que rompieron con el archivo
 * real del cliente y que ningún test con un archivo inventado habría visto
 * (ensayo de la fase 4, 2026-09-03):
 *
 *  1. **Las cabeceras no están en la primera fila.** El archivo que entrega la
 *     plataforma de tickets trae su título arriba, un renglón en blanco y las
 *     cabeceras en la cuarta. Leyendo la primera, SheetJS tomaba el título como
 *     única columna y el panel decía que faltaban las catorce.
 *  2. **La puntuación final solo se recorta contra un catálogo.** Recortarla en
 *     todos los campos convertía «Agroandina S.A.S.» en «Agroandina S.A.S», o
 *     sea casi cualquier empresa colombiana.
 */

/** Las cabeceras del archivo real, con su puntuación y sus tildes. */
const CABECERAS = [
    'Rol A Desempeñar En El Evento',
    'Ticket',
    'Tipo',
    'CC/TI/CE',
    'Nombres',
    'Apellidos',
    'Sexo',
    'Teléfono Móvil',
    'Empresa / Organización',
    'Cargo En La Empresa / Organización',
    'Fecha De Nacimiento',
    'E-mail',
    'País',
    'Departamento',
    'Ciudad',
    'Dirección:',
    'Acepto Terminos Y Condiciones Del Evento',
    'Nota Interna',
];

function fila(valores: Record<string, unknown>): unknown[] {
    return CABECERAS.map(c => valores[c] ?? '');
}

const PERSONA = {
    'Rol A Desempeñar En El Evento': 'Asistente',
    'Ticket': 'Legacy Summit 2026',
    'Tipo': 'CC/TI/CE',
    'CC/TI/CE': '1020304050',
    'Nombres': 'Ana María',
    'Apellidos': 'Restrepo Uribe',
    'Sexo': 'Femenino',
    'Teléfono Móvil': '3001234567',
    'Empresa / Organización': 'Agroandina S.A.S.',
    'Cargo En La Empresa / Organización': 'Gerente',
    'Fecha De Nacimiento': '15/01/1990',
    'E-mail': 'ana@empresa.test',
    'País': 'Colombia',
    'Departamento': 'Antioquia',
    'Ciudad': 'Medellín',
    'Dirección:': 'Calle 10 # 43-21.',
    'Acepto Terminos Y Condiciones Del Evento': '1.0',
    'Nota Interna': 'da igual',
};

/** Arma un .xls de verdad —BIFF, como el del cliente— y lo envuelve en un File. */
function archivoCon(filas: unknown[][]): File {
    const hoja = XLSX.utils.aoa_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Worksheet');
    const binario: ArrayBuffer = XLSX.write(libro, { bookType: 'biff8', type: 'array' });
    return {
        name: 'asistentes.xls',
        arrayBuffer: async () => binario,
    } as unknown as File;
}

describe('lector del archivo de asistentes', () => {
    it('encuentra las cabeceras aunque estén en la cuarta fila, como el archivo real', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            ['Formato de carga masiva Legacy Summit 2026'],
            [],
            CABECERAS,
            fila(PERSONA),
        ]));

        expect(leido.columnasFaltantes).toEqual([]);
        expect(leido.filaDeCabeceras).toBe(3);
        expect(leido.filas.length).toBe(1);
    });

    it('numera las filas como la hoja de cálculo, para poder ir a corregirlas', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            ['Formato de carga masiva Legacy Summit 2026'],
            [],
            CABECERAS,
            fila({ ...PERSONA, 'E-mail': 'uno@empresa.test' }),
            fila({ ...PERSONA, 'E-mail': 'dos@empresa.test' }),
        ]));

        // Cabeceras en la 3 → la primera fila con datos es la 4.
        expect(leido.filas.map(f => f.fila)).toEqual([4, 5]);
    });

    it('sigue leyendo un archivo con las cabeceras en la primera fila', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            CABECERAS,
            fila(PERSONA),
        ]));

        expect(leido.columnasFaltantes).toEqual([]);
        expect(leido.filaDeCabeceras).toBe(1);
        expect(leido.filas[0].fila).toBe(2);
    });

    it('no le quita el punto final a una empresa ni a una dirección', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([CABECERAS, fila(PERSONA)]));

        expect(leido.filas[0].empresa).toBe('Agroandina S.A.S.');
        expect(leido.filas[0].direccion).toBe('Calle 10 # 43-21.');
    });

    it('sí recorta la puntuación del tipo de documento, que va contra el catálogo', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            CABECERAS,
            fila({ ...PERSONA, 'Tipo': 'Pasaporte,' }),
        ]));

        expect(leido.filas[0].tipo_documento).toBe('Pasaporte');
    });

    it('lee la casilla de términos que llega como 1.0 y 0.0', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            CABECERAS,
            fila({ ...PERSONA, 'E-mail': 'si@empresa.test', 'Acepto Terminos Y Condiciones Del Evento': '1.0' }),
            fila({ ...PERSONA, 'E-mail': 'no@empresa.test', 'Acepto Terminos Y Condiciones Del Evento': '0.0' }),
        ]));

        expect(leido.filas[0].acepta_terminos).toBeTrue();
        expect(leido.filas[1].acepta_terminos).toBeFalse();
    });

    it('conserva los acentos', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([CABECERAS, fila(PERSONA)]));

        expect(leido.filas[0].nombres).toBe('Ana María');
        expect(leido.filas[0].ciudad).toBe('Medellín');
    });

    it('descarta las filas vacías de la cola sin contarlas como error', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            CABECERAS,
            fila(PERSONA),
            [],
            [],
        ]));

        expect(leido.filas.length).toBe(1);
    });

    it('avisa de las columnas que no se importan sin tratarlas como problema', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([CABECERAS, fila(PERSONA)]));

        expect(leido.columnasIgnoradas).toContain('Nota Interna');
        expect(leido.columnasIgnoradas).toContain('Ticket');
        // La casilla de términos sí se importa, así que no es una ignorada.
        expect(leido.columnasIgnoradas).not.toContain('Acepto Terminos Y Condiciones Del Evento');
    });

    it('con un archivo que no es el formato, dice que faltan todas y no inventa filas', async () => {
        const leido = await leerArchivoDeAsistentes(archivoCon([
            ['Cosa', 'Otra cosa'],
            ['1', '2'],
        ]));

        expect(leido.filas).toEqual([]);
        expect(leido.columnasFaltantes.length).toBeGreaterThan(10);
    });
});
