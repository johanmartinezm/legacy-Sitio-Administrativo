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
    /** Cuántas quedarían inscritas al evento. Solo lo calcula la simulación. */
    por_inscribir: number;
    /** Cuántas quedaron inscritas de verdad. */
    inscritas: number;
    /** Las que ya estaban en ese evento: repasar el archivo no duplica a nadie. */
    ya_inscritas: number;
    problemas: ProblemaDeFila[];
}

/**
 * Lo que distingue las dos entradas de la carga
 * (`reports/20260826_plan_carga_masiva.md` §4).
 *
 * Por dentro del backend hay **un solo importador** y **una sola ruta**: lo
 * único que cambia entre «Importar usuarios» e «Importar asistentes» es si hay
 * un evento de por medio.
 */
export interface OpcionesImportacion {
    /**
     * Vacío o ausente: solo se crean cuentas. Con evento, además se inscribe a
     * todo el archivo a **ese** evento — lo fija la pantalla, no el archivo, y
     * por eso la columna «Ticket» no se lee.
     */
    evento_id?: string;
    /**
     * Crea el código de acceso. Apagado por defecto: la inscripción queda sin
     * credencial y esa persona no pasa el check-in hasta que se le genere desde
     * la pantalla de inscritos.
     */
    generar_credencial?: boolean;
    /**
     * Manda un correo por persona. Apagado por defecto: una carga de
     * trescientas filas que avisa sin que nadie lo pida son trescientos
     * correos. Qué correo sale depende del otro interruptor, y nunca salen los
     * dos.
     */
    avisar_por_correo?: boolean;
}
