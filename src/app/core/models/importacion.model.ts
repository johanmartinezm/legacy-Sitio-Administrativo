/**
 * Una fila del archivo de asistentes, ya traducida a lo que entiende el backend.
 *
 * El archivo trae 42 columnas y **se importan 15**: las de sesiones, las de
 * facturación y tres más se descartaron por decisión del cliente
 * (`reports/20260826_plan_carga_masiva.md` §3).
 */
export interface FilaImportacion {
    /** El número de fila de la hoja de cálculo, tal como lo ve quien la preparó. */
    fila: number;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    empresa: string;
    cargo: string;
    tipo_documento: string;
    numero_documento: string;
    pais: string;
    ciudad: string;
    departamento: string;
    direccion: string;
    sexo: string;
    fecha_nacimiento: string;
    acepta_terminos: boolean;
}

/** Qué fila y qué columna hay que corregir. Se corrige el archivo, no el código. */
export interface ProblemaDeFila {
    fila: number;
    columna: string;
    motivo: string;
}

/**
 * El informe que devuelven tanto la simulación como la carga.
 *
 * `simulacion: true` significa que **no se escribió nada**: o se pidió simular,
 * o se pidió aplicar y el archivo traía problemas.
 */
export interface ResultadoImportacion {
    simulacion: boolean;
    total: number;
    nuevas: number;
    ya_existian: number;
    creadas: number;
    problemas: ProblemaDeFila[];
}
