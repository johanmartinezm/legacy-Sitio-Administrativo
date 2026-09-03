import * as XLSX from 'xlsx';

import { FilaImportacion } from '../models/importacion.model';

/**
 * Lee el archivo de asistentes y devuelve las filas que el backend entiende.
 *
 * El lector vive aquí y no en el backend por una razón concreta: el archivo que
 * entrega la plataforma de tickets es un **`.xls`** (BIFF, el formato viejo de
 * Excel) y SheetJS abre BIFF y `.xlsx` por igual, así que el servidor recibe
 * JSON y no necesita ningún lector de Excel.
 * Ver `reports/20260826_plan_carga_masiva.md` §1.
 */

/** Cabeceras del archivo → campo del backend. Solo las 15 que se importan. */
const COLUMNAS: Record<string, keyof FilaImportacion> = {
    'Nombres': 'nombres',
    'Apellidos': 'apellidos',
    'E-mail': 'email',
    'Teléfono Móvil': 'telefono',
    'Empresa / Organización': 'empresa',
    'Cargo En La Empresa / Organización': 'cargo',
    'Tipo': 'tipo_documento',
    'CC/TI/CE': 'numero_documento',
    'País': 'pais',
    'Ciudad': 'ciudad',
    'Departamento': 'departamento',
    'Dirección:': 'direccion',
    'Sexo': 'sexo',
    'Fecha De Nacimiento': 'fecha_nacimiento',
};

/** La casilla de términos del evento. Llega como 1.0 / 0.0, no como texto. */
const COLUMNA_TERMINOS = 'Acepto Terminos Y Condiciones Del Evento';

/**
 * Normaliza una cabecera para compararla: sin espacios de sobra, sin dos puntos
 * finales y sin distinguir mayúsculas ni tildes.
 *
 * Hace falta porque estas cabeceras las escribe otra plataforma y ya se ha visto
 * puntuación pegada al final —la columna «Dirección:» trae dos puntos, y algunos
 * valores acaban en coma—.
 */
function normalizarCabecera(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[\s:.,;]+$/g, '')
        .trim()
        .toLowerCase();
}

const COLUMNAS_NORMALIZADAS = new Map<string, keyof FilaImportacion>(
    Object.entries(COLUMNAS).map(([cabecera, campo]) => [normalizarCabecera(cabecera), campo])
);

/**
 * Recorta espacios. Nada más.
 *
 * **La puntuación final NO se toca aquí**, y hubo que corregirlo: recortarla en
 * todos los campos convertía «Agroandina S.A.S.» en «Agroandina S.A.S» —o sea,
 * en casi cualquier empresa colombiana— y le quitaba el punto a una dirección
 * escrita con él. La regla del plan es recortar antes de comparar **contra un
 * catálogo**, y para eso está `limpiarParaCatalogo`; un nombre de empresa o una
 * dirección no se comparan contra nada.
 */
function limpiar(valor: unknown): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim();
}

/**
 * Como `limpiar`, pero además quita la puntuación pegada al final.
 *
 * Solo para los valores que se comparan contra una lista cerrada, que es donde
 * un carácter de más significa «no coincide con nada»: el archivo trae
 * puntuación pegada —el segundo valor de *Ticket* termina en coma— y el tipo de
 * documento hay que traducirlo al catálogo de Legacy.
 */
function limpiarParaCatalogo(valor: unknown): string {
    return limpiar(valor).replace(/[.,;:]+$/, '').trim();
}

/**
 * La casilla de términos llega del archivo como `1.0` o `0.0`, y de una versión
 * editada a mano podría llegar como «Sí» o «true». Se aceptan las tres formas;
 * cualquier otra cosa cuenta como no aceptado.
 */
function esAfirmativo(valor: unknown): boolean {
    const texto = limpiarParaCatalogo(valor).toLowerCase();
    if (texto === '') return false;
    const numero = Number(texto);
    if (!Number.isNaN(numero)) return numero > 0;
    return ['si', 'sí', 'true', 'x', 'verdadero'].includes(texto);
}

/**
 * Las fechas de Excel pueden llegar como número de serie —los días desde 1900—
 * en vez de como texto. SheetJS las convierte si se le pide `cellDates`, pero
 * una hoja guardada como texto llega tal cual, así que se contemplan las dos.
 */
function fechaComoTexto(valor: unknown): string {
    if (valor instanceof Date) {
        const dia = String(valor.getDate()).padStart(2, '0');
        const mes = String(valor.getMonth() + 1).padStart(2, '0');
        return `${dia}/${mes}/${valor.getFullYear()}`;
    }
    return limpiarParaCatalogo(valor);
}

export interface ArchivoLeido {
    filas: FilaImportacion[];
    /** Cabeceras del archivo que no se importan. Solo para avisar, no es un error. */
    columnasIgnoradas: string[];
    /** Cabeceras que se esperaban y no estaban. Si falta E-mail, no hay nada que hacer. */
    columnasFaltantes: string[];
    /**
     * En qué fila de la hoja estaban las cabeceras. Se devuelve para poder
     * decirlo en pantalla: si el lector se equivoca de fila, quien mira el
     * informe tiene que poder darse cuenta.
     */
    filaDeCabeceras: number;
}

/**
 * Cuántas filas se miran buscando las cabeceras.
 *
 * Con el archivo del cliente basta 4, pero el margen es barato: son celdas que
 * ya están en memoria, y un exportador que añada un renglón de más no puede
 * dejar la carga inservible.
 */
const FILAS_A_MIRAR_BUSCANDO_CABECERAS = 15;

/**
 * Busca en qué fila están las cabeceras y devuelve su índice dentro de `filas`.
 *
 * **No se puede suponer que sean la primera fila, y este es el detalle que el
 * archivo real enseñó:** el que entrega la plataforma de tickets trae su título
 * en una fila, un renglón en blanco y **las cabeceras en la cuarta**. Leyendo la
 * primera, SheetJS tomaba el título como única columna y bautizaba el resto
 * `__EMPTY`, `__EMPTY_1`…, así que el panel decía que al archivo le faltaban las
 * catorce columnas y no dejaba ni revisarlo.
 *
 * Se elige la fila que más cabeceras conocidas reconoce, y no la primera que
 * reconozca alguna: una celda suelta que se llame «Ciudad» en un encabezado
 * decorativo no puede ganarle a la fila que trae las cuarenta y dos.
 *
 * Devuelve -1 si ninguna fila se parece a una cabecera.
 */
function buscarFilaDeCabeceras(filas: unknown[][]): number {
    let mejor = -1;
    let mejorAciertos = 0;

    const tope = Math.min(filas.length, FILAS_A_MIRAR_BUSCANDO_CABECERAS);
    for (let i = 0; i < tope; i++) {
        const vistas = new Set<string>();
        for (const celda of filas[i] ?? []) {
            const normal = normalizarCabecera(String(celda ?? ''));
            if (!normal) continue;
            if (COLUMNAS_NORMALIZADAS.has(normal) || normal === normalizarCabecera(COLUMNA_TERMINOS)) {
                vistas.add(normal);
            }
        }
        if (vistas.size > mejorAciertos) {
            mejorAciertos = vistas.size;
            mejor = i;
        }
    }

    // Con menos de tres aciertos no es una fila de cabeceras, es una casualidad.
    // Vale más decir que no se reconoce el archivo que importar cualquier cosa.
    return mejorAciertos >= 3 ? mejor : -1;
}

/**
 * Convierte el archivo en filas listas para mandar.
 *
 * El número de fila que se guarda es **el de la hoja de cálculo**, contando
 * desde 1 como lo hace Excel, porque es el que verá quien tenga que corregirla.
 * Se calcula desde la fila de cabeceras encontrada, no dando por hecho ninguna.
 */
export async function leerArchivoDeAsistentes(archivo: File): Promise<ArchivoLeido> {
    const datos = await archivo.arrayBuffer();
    const libro = XLSX.read(datos, { cellDates: true });
    const hoja = libro.Sheets[libro.SheetNames[0]];

    // `range: 0` fuerza a empezar en la primera fila de la hoja y no en el
    // origen de `!ref`, que en el archivo real es A2. Con eso el índice de cada
    // fila del array es su número de Excel menos uno, y no hay que corregir un
    // desfase que solo se nota con ciertos archivos.
    const crudas = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
        header: 1,
        range: 0,
        defval: '',
        raw: false,
        blankrows: true,
    });

    const indiceCabeceras = buscarFilaDeCabeceras(crudas);
    if (indiceCabeceras < 0) {
        return {
            filas: [],
            columnasIgnoradas: [],
            columnasFaltantes: Object.keys(COLUMNAS),
            filaDeCabeceras: 0,
        };
    }

    const cabeceras = (crudas[indiceCabeceras] ?? []).map(c => String(c ?? ''));
    const columnasIgnoradas: string[] = [];
    const encontradas = new Set<keyof FilaImportacion>();
    // Índice de columna → a qué campo va. Se resuelve una vez y no por celda.
    const destinoDeColumna = new Map<number, keyof FilaImportacion | 'terminos'>();

    cabeceras.forEach((cabecera, columna) => {
        const normal = normalizarCabecera(cabecera);
        if (!normal) return;

        if (normal === normalizarCabecera(COLUMNA_TERMINOS)) {
            destinoDeColumna.set(columna, 'terminos');
            return;
        }

        const campo = COLUMNAS_NORMALIZADAS.get(normal);
        if (campo) {
            encontradas.add(campo);
            destinoDeColumna.set(columna, campo);
        } else {
            columnasIgnoradas.push(cabecera);
        }
    });

    const columnasFaltantes = Object.entries(COLUMNAS)
        .filter(([, campo]) => !encontradas.has(campo))
        .map(([cabecera]) => cabecera);

    const filas: FilaImportacion[] = [];
    for (let i = indiceCabeceras + 1; i < crudas.length; i++) {
        const cruda = crudas[i] ?? [];
        const fila: FilaImportacion = {
            // +1 porque Excel cuenta desde 1 y el array desde 0.
            fila: i + 1,
            nombres: '',
            apellidos: '',
            email: '',
            telefono: '',
            empresa: '',
            cargo: '',
            tipo_documento: '',
            numero_documento: '',
            pais: '',
            ciudad: '',
            departamento: '',
            direccion: '',
            sexo: '',
            fecha_nacimiento: '',
            acepta_terminos: false,
        };

        for (const [columna, destino] of destinoDeColumna) {
            const valor = cruda[columna];
            if (destino === 'terminos') {
                fila.acepta_terminos = esAfirmativo(valor);
                continue;
            }
            if (destino === 'fila' || destino === 'acepta_terminos') continue;
            // El tipo de documento se compara contra el catálogo de Legacy, así
            // que ahí sí se recorta la puntuación. El resto son textos libres y
            // se guardan tal cual llegan.
            fila[destino] = (destino === 'fecha_nacimiento'
                ? fechaComoTexto(valor)
                : destino === 'tipo_documento'
                    ? limpiarParaCatalogo(valor)
                    : limpiar(valor)) as never;
        }

        // Una fila completamente vacía es la típica cola de la hoja: no es un
        // error del archivo, así que no se manda ni se cuenta.
        if (fila.email !== '' || fila.nombres !== '' || fila.numero_documento !== '') {
            filas.push(fila);
        }
    }

    return { filas, columnasIgnoradas, columnasFaltantes, filaDeCabeceras: indiceCabeceras + 1 };
}
