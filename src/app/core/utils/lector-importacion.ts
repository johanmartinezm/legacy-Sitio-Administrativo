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

/** Recorta espacios y la puntuación que algunas celdas traen pegada al final. */
function limpiar(valor: unknown): string {
    if (valor === null || valor === undefined) return '';
    return String(valor).trim().replace(/[.,;]+$/, '').trim();
}

/**
 * La casilla de términos llega del archivo como `1.0` o `0.0`, y de una versión
 * editada a mano podría llegar como «Sí» o «true». Se aceptan las tres formas;
 * cualquier otra cosa cuenta como no aceptado.
 */
function esAfirmativo(valor: unknown): boolean {
    const texto = limpiar(valor).toLowerCase();
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
    return limpiar(valor);
}

export interface ArchivoLeido {
    filas: FilaImportacion[];
    /** Cabeceras del archivo que no se importan. Solo para avisar, no es un error. */
    columnasIgnoradas: string[];
    /** Cabeceras que se esperaban y no estaban. Si falta E-mail, no hay nada que hacer. */
    columnasFaltantes: string[];
}

/**
 * Convierte el archivo en filas listas para mandar.
 *
 * El número de fila que se guarda es el de la hoja de cálculo —la cabecera es la
 * 1, así que la primera fila con datos es la 2—, porque es el que verá quien
 * tenga que corregirla.
 */
export async function leerArchivoDeAsistentes(archivo: File): Promise<ArchivoLeido> {
    const datos = await archivo.arrayBuffer();
    const libro = XLSX.read(datos, { cellDates: true });
    const hoja = libro.Sheets[libro.SheetNames[0]];

    const crudas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, {
        defval: '',
        raw: false,
    });

    const cabeceras = crudas.length > 0 ? Object.keys(crudas[0]) : [];
    const columnasIgnoradas: string[] = [];
    const encontradas = new Set<keyof FilaImportacion>();

    for (const cabecera of cabeceras) {
        const campo = COLUMNAS_NORMALIZADAS.get(normalizarCabecera(cabecera));
        if (campo) {
            encontradas.add(campo);
        } else if (normalizarCabecera(cabecera) !== normalizarCabecera(COLUMNA_TERMINOS)) {
            columnasIgnoradas.push(cabecera);
        }
    }

    const columnasFaltantes = Object.entries(COLUMNAS)
        .filter(([, campo]) => !encontradas.has(campo))
        .map(([cabecera]) => cabecera);

    const filas: FilaImportacion[] = crudas.map((cruda, indice) => {
        const fila: FilaImportacion = {
            fila: indice + 2,
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

        for (const [cabecera, valor] of Object.entries(cruda)) {
            const normal = normalizarCabecera(cabecera);
            if (normal === normalizarCabecera(COLUMNA_TERMINOS)) {
                fila.acepta_terminos = esAfirmativo(valor);
                continue;
            }
            const campo = COLUMNAS_NORMALIZADAS.get(normal);
            if (!campo || campo === 'fila' || campo === 'acepta_terminos') continue;
            fila[campo] = campo === 'fecha_nacimiento'
                ? fechaComoTexto(valor)
                : limpiar(valor) as never;
        }

        return fila;
    });

    // Una fila completamente vacía es la típica cola de la hoja: no es un error
    // del archivo, así que no se manda ni se cuenta.
    const conDatos = filas.filter(f =>
        f.email !== '' || f.nombres !== '' || f.numero_documento !== ''
    );

    return { filas: conDatos, columnasIgnoradas, columnasFaltantes };
}
