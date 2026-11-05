/**
 * Las fechas de un evento (`start_date`, `end_date`) son columnas `date`: un día,
 * sin hora ni zona. El backend las manda como medianoche UTC
 * («2026-12-10T00:00:00Z»).
 *
 * Hasta el 2026-11-05 el panel hacía `new Date(dto.date)`, y en Colombia (UTC-5)
 * eso es el 9 de diciembre a las 19:00: el listado, la cabecera de workshops y
 * el selector de eventos mostraban el día anterior, y el diálogo proponía ese
 * día equivocado para un workshop nuevo.
 */

/** Lee el día tal cual, como medianoche local, sin pasar por la zona. */
export function leerFechaDeEvento(valor: string | null | undefined): Date | undefined {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? '');
    if (!m) return undefined;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Escribe el día que se ve en el calendario, como medianoche UTC, que es lo que
 * el backend guarda en la columna `date`. Con `toISOString()` de una
 * medianoche local, un administrador al este de Greenwich guardaría el día
 * anterior.
 */
export function escribirFechaDeEvento(fecha: Date | null | undefined): string | undefined {
    if (!fecha) return undefined;
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return undefined;
    const dos = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T00:00:00Z`;
}
