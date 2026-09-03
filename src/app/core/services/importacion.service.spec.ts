import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ImportacionService, TAMANO_DE_TANDA } from './importacion.service';
import { ConfigService } from './config.service';
import { FilaImportacion, ResultadoImportacion } from '../models/importacion.model';

/**
 * Lo que protegen estas pruebas es la carga por tandas.
 *
 * Existe por una medición, no por gusto: crear una cuenta cuesta ~120 ms —casi
 * todo bcrypt— así que 200 filas en una sola petición tardan 24 s y 300 pasarían
 * de medio minuto. Ahí ya no manda nuestro servidor sino el proxy de delante, y
 * el fallo sería el peor de todos: el panel diciendo «no se pudo» mientras el
 * backend sigue creando cuentas.
 *
 * Partirlo en tandas es seguro porque el importador es reejecutable, pero
 * introduce una aritmética nueva —sumar informes— que es justo donde se cuela un
 * error que nadie nota hasta que las cifras no cuadran.
 */

function fila(n: number): FilaImportacion {
    return {
        fila: n + 2,
        nombres: `Persona${n}`,
        apellidos: `Apellido${n}`,
        email: `persona${n}@empresa.test`,
        telefono: '3001234567',
        empresa: 'Agroandina S.A.S.',
        cargo: 'Gerente',
        tipo_documento: 'CC/TI/CE',
        numero_documento: String(1020304050 + n),
        pais: 'Colombia',
        ciudad: 'Medellín',
        departamento: 'Antioquia',
        direccion: 'Calle 10 # 43-21',
        sexo: 'Femenino',
        fecha_nacimiento: '15/01/1990',
        acepta_terminos: true,
    };
}

function filas(n: number): FilaImportacion[] {
    return Array.from({ length: n }, (_, i) => fila(i));
}

/** La respuesta de una tanda que aplicó limpiamente. */
function tandaOk(cuantas: number, conEvento = false): ResultadoImportacion {
    return {
        simulacion: false,
        total: cuantas,
        nuevas: cuantas,
        ya_existian: 0,
        creadas: cuantas,
        por_inscribir: 0,
        inscritas: conEvento ? cuantas : 0,
        ya_inscritas: 0,
        problemas: [],
    };
}

describe('ImportacionService · carga por tandas', () => {
    let servicio: ImportacionService;
    let http: HttpTestingController;
    const API = 'http://api.test/api/admin/importaciones/usuarios';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                ImportacionService,
                { provide: ConfigService, useValue: { apiUrl: 'http://api.test' } },
            ],
        });
        servicio = TestBed.inject(ImportacionService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('la simulación va en UNA sola petición con el archivo entero', () => {
        // No se parte, y es a propósito: la comprobación de correos repetidos
        // dentro del archivo solo funciona mirando todas las filas juntas.
        servicio.simular(filas(120)).subscribe();

        const peticion = http.expectOne(`${API}?simular=true`);
        expect(peticion.request.body.filas.length).toBe(120);
        peticion.flush(tandaOk(0));
    });

    it('parte la carga en tandas del tamaño previsto', () => {
        servicio.aplicar(filas(120)).subscribe();

        // 120 filas con tandas de 50 → 50, 50 y 20.
        const esperadas = [TAMANO_DE_TANDA, TAMANO_DE_TANDA, 120 - 2 * TAMANO_DE_TANDA];
        for (const cuantas of esperadas) {
            const peticion = http.expectOne(API);
            expect(peticion.request.body.filas.length).toBe(cuantas);
            peticion.flush(tandaOk(cuantas));
        }
    });

    it('un archivo más corto que una tanda va en una sola petición', () => {
        servicio.aplicar(filas(10)).subscribe();

        const peticion = http.expectOne(API);
        expect(peticion.request.body.filas.length).toBe(10);
        peticion.flush(tandaOk(10));
    });

    it('suma los informes y conserva el total del archivo, no el de la tanda', () => {
        let final: ResultadoImportacion | undefined;
        servicio.aplicar(filas(120), { evento_id: 'evt-1' }).subscribe(r => (final = r));

        http.expectOne(API).flush(tandaOk(50, true));
        http.expectOne(API).flush(tandaOk(50, true));
        http.expectOne(API).flush(tandaOk(20, true));

        expect(final!.total).toBe(120);
        expect(final!.creadas).toBe(120);
        expect(final!.inscritas).toBe(120);
        expect(final!.simulacion).toBeFalse();
    });

    it('las opciones viajan en todas las tandas, no solo en la primera', () => {
        servicio.aplicar(filas(120), {
            evento_id: 'evt-1',
            generar_credencial: true,
            avisar_por_correo: false,
        }).subscribe();

        for (const cuantas of [50, 50, 20]) {
            const peticion = http.expectOne(API);
            expect(peticion.request.body.evento_id).toBe('evt-1');
            expect(peticion.request.body.generar_credencial).toBeTrue();
            expect(peticion.request.body.avisar_por_correo).toBeFalse();
            peticion.flush(tandaOk(cuantas, true));
        }
    });

    it('se para en la primera tanda con problemas y no manda las siguientes', () => {
        let final: ResultadoImportacion | undefined;
        servicio.aplicar(filas(120)).subscribe(r => (final = r));

        http.expectOne(API).flush(tandaOk(50));
        http.expectOne(API).flush({
            ...tandaOk(0),
            simulacion: true,
            problemas: [{ fila: 60, columna: 'E-mail', motivo: 'no se pudo crear la cuenta' }],
        });

        // La tercera tanda no se manda: `http.verify()` del afterEach lo exige.
        expect(final!.problemas.length).toBe(1);
        // Y lo de la primera tanda **sí se creó**: el informe no puede decir que
        // no se escribió nada.
        expect(final!.creadas).toBe(50);
        expect(final!.simulacion).toBeFalse();
    });

    it('si el backend rechaza el archivo entero, el informe sigue siendo una simulación', () => {
        // Una sola tanda que vuelve sin escribir: no se creó nada, y decir lo
        // contrario mandaría a buscar cuentas que no existen.
        let final: ResultadoImportacion | undefined;
        servicio.aplicar(filas(10)).subscribe(r => (final = r));

        http.expectOne(API).flush({
            ...tandaOk(0),
            simulacion: true,
            total: 10,
            nuevas: 0,
            problemas: [{ fila: 3, columna: 'Nombres', motivo: 'está vacío' }],
        });

        expect(final!.simulacion).toBeTrue();
        expect(final!.creadas).toBe(0);
    });

    it('avisa del avance después de cada tanda, para que la pantalla no parezca colgada', () => {
        const avances: number[] = [];
        servicio.aplicar(filas(120), {}, hechas => avances.push(hechas)).subscribe();

        http.expectOne(API).flush(tandaOk(50));
        http.expectOne(API).flush(tandaOk(50));
        http.expectOne(API).flush(tandaOk(20));

        expect(avances).toEqual([50, 100, 120]);
    });

    it('un archivo sin filas no manda ninguna petición', () => {
        let final: ResultadoImportacion | undefined;
        servicio.aplicar([]).subscribe(r => (final = r));

        expect(final!.total).toBe(0);
        expect(final!.creadas).toBe(0);
    });
});
