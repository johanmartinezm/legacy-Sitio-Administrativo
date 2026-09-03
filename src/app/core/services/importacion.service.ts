import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { ConfigService } from './config.service';
import { FilaImportacion, OpcionesImportacion, ResultadoImportacion } from '../models/importacion.model';

/**
 * Cuántas filas van en cada petición de la carga.
 *
 * **No es un número redondo cualquiera: es tiempo.** Crear una cuenta cuesta
 * ~120 ms, casi todo bcrypt hasheando la contraseña, y eso no se puede bajar sin
 * debilitar el hash. Medido contra el servidor el 2026-09-03: 50 filas tardan
 * 5,5 s y 200 tardan 24 s. Un archivo de trescientas personas en una sola
 * petición serían ~36 s, y ahí ya no manda nuestro servidor —que no tiene
 * `WriteTimeout`— sino el HAProxy de delante y el propio navegador.
 *
 * El fallo que esto evita es feo: el panel diría «no se pudo» mientras el
 * backend sigue creando cuentas tan tranquilo. Con tandas de 50, ninguna
 * petición pasa de unos segundos.
 */
export const TAMANO_DE_TANDA = 50;

/**
 * Carga masiva de asistentes.
 *
 * Dos pasos, y el orden importa: **simular** no escribe nada y devuelve el
 * informe; **aplicar** solo crea cuentas si ese informe sale limpio. El botón de
 * confirmar de la pantalla se apoya en eso.
 */
@Injectable({
    providedIn: 'root'
})
export class ImportacionService {
    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/admin/importaciones/usuarios`;
    }

    /**
     * No escribe nada: cuenta cuántas cuentas se crearían, cuántas quedarían
     * inscritas y qué hay que corregir.
     *
     * **Va en una sola petición, con el archivo entero, y tiene que seguir
     * así:** la comprobación de correos repetidos *dentro del archivo* solo
     * funciona si todas las filas se miran juntas. Partida en tandas, un correo
     * duplicado entre la tanda 1 y la 3 no lo vería nadie.
     *
     * Puede permitírselo porque no escribe: 200 filas se revisan en 0,12 s.
     */
    simular(filas: FilaImportacion[], opciones: OpcionesImportacion = {}): Observable<ResultadoImportacion> {
        return this.http.post<ResultadoImportacion>(`${this.apiUrl}?simular=true`, { filas, ...opciones });
    }

    /**
     * Crea las cuentas que faltan y, con `evento_id`, además inscribe.
     *
     * **Va por tandas** (ver `TAMANO_DE_TANDA`), y eso es seguro precisamente
     * por cómo está hecho el importador: la identidad es el correo, así que una
     * tanda que se repita no duplica a nadie —cuenta esas filas como «ya
     * existían»— y una que falle se puede reintentar pasando el mismo archivo.
     *
     * `alAvanzar` recibe cuántas filas van procesadas; sirve para que la
     * pantalla no parezca colgada mientras corren las tandas.
     */
    aplicar(
        filas: FilaImportacion[],
        opciones: OpcionesImportacion = {},
        alAvanzar?: (hechas: number, total: number) => void
    ): Observable<ResultadoImportacion> {
        const tandas: FilaImportacion[][] = [];
        for (let i = 0; i < filas.length; i += TAMANO_DE_TANDA) {
            tandas.push(filas.slice(i, i + TAMANO_DE_TANDA));
        }

        return this.aplicarTanda(tandas, 0, opciones, informeVacio(filas.length), alAvanzar);
    }

    /**
     * Manda una tanda y encadena la siguiente con lo acumulado.
     *
     * **Se para en la primera tanda con problemas.** Aplicar solo se permite
     * después de una simulación limpia, así que un problema aquí es un fallo de
     * la base, no una fila mal escrita: seguir adelante solo acumularía el mismo
     * error. Lo que ya se creó queda creado y el informe lo dice; volver a pasar
     * el archivo retoma donde se quedó, porque las filas hechas se saltan por
     * existir.
     */
    private aplicarTanda(
        tandas: FilaImportacion[][],
        indice: number,
        opciones: OpcionesImportacion,
        acumulado: ResultadoImportacion,
        alAvanzar?: (hechas: number, total: number) => void
    ): Observable<ResultadoImportacion> {
        if (indice >= tandas.length) {
            return of(acumulado);
        }

        return this.http
            .post<ResultadoImportacion>(this.apiUrl, { filas: tandas[indice], ...opciones })
            .pipe(
                switchMap(informe => {
                    const sumado = sumarInformes(acumulado, informe);
                    const hechas = tandas
                        .slice(0, indice + 1)
                        .reduce((n, t) => n + t.length, 0);
                    alAvanzar?.(hechas, sumado.total);

                    if (informe.problemas.length > 0) {
                        return of(sumado);
                    }
                    return this.aplicarTanda(tandas, indice + 1, opciones, sumado, alAvanzar);
                })
            );
    }
}

/** El acumulador de partida. `total` es el del archivo, no el de las tandas. */
function informeVacio(total: number): ResultadoImportacion {
    return {
        // Se arranca en true —«no se ha escrito nada»— y la primera tanda que
        // aplique de verdad lo baja. Así un archivo que falla en la tanda 1 no
        // dice que se escribió algo cuando no fue así.
        simulacion: true,
        total,
        nuevas: 0,
        ya_existian: 0,
        creadas: 0,
        por_inscribir: 0,
        inscritas: 0,
        ya_inscritas: 0,
        problemas: [],
    };
}

/**
 * Junta el informe de una tanda con lo que llevamos.
 *
 * `total` no se suma: es el del archivo entero y se fijó al empezar. Lo demás sí,
 * porque cada tanda cuenta lo suyo.
 */
function sumarInformes(a: ResultadoImportacion, b: ResultadoImportacion): ResultadoImportacion {
    return {
        // Deja de ser una simulación en cuanto una tanda escribe algo. Una tanda
        // que vuelve con `simulacion: true` no escribió nada, pero las
        // anteriores sí, y el informe final tiene que decir eso.
        simulacion: a.simulacion && b.simulacion,
        total: a.total,
        nuevas: a.nuevas + b.nuevas,
        ya_existian: a.ya_existian + b.ya_existian,
        creadas: a.creadas + b.creadas,
        por_inscribir: a.por_inscribir + b.por_inscribir,
        inscritas: a.inscritas + b.inscritas,
        ya_inscritas: a.ya_inscritas + b.ya_inscritas,
        problemas: a.problemas.concat(b.problemas),
    };
}
