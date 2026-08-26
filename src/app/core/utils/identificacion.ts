/**
 * Países y tipos de identificación, **espejo** de
 * `App-Movil/lib/domain/utils/identificacion_empresarial.dart`.
 *
 * Existe porque el panel ofrecía otro catálogo que el de la app: Colombia/Otro
 * frente a diecisiete países, y `CC`/`CE`/`NIT`/`Pasaporte` frente a `Cédula`,
 * `RUC`, `RFC`, `DNI`... Como el valor se guarda tal cual, al abrir a editar a
 * alguien registrado desde la app el desplegable no encontraba su opción y se
 * pintaba vacío: parecía que el dato no estaba, y al guardar se perdía.
 *
 * Si se toca el catálogo de la app, hay que tocar este. No hay nada que lo
 * verifique automáticamente: los dos repositorios son independientes.
 */

/** Países LATAM que el registro reconoce. "Otro" al final, como salida. */
export const PAISES_LATAM: readonly string[] = [
  'Colombia',
  'México',
  'Perú',
  'Chile',
  'Argentina',
  'Ecuador',
  'Panamá',
  'República Dominicana',
  'Venezuela',
  'Bolivia',
  'Paraguay',
  'Uruguay',
  'Costa Rica',
  'Guatemala',
  'Honduras',
  'El Salvador',
  'Nicaragua',
  'Otro',
];

const TIPOS_POR_PAIS: Readonly<Record<string, readonly string[]>> = {
  'Colombia': ['NIT', 'Cédula', 'Cédula de extranjería', 'Pasaporte', 'Tarjeta de identidad'],
  'México': ['RFC', 'Pasaporte', 'Otro'],
  'Perú': ['RUC', 'DNI', 'Pasaporte', 'Otro'],
  'Chile': ['RUT', 'Pasaporte', 'Otro'],
  'Argentina': ['CUIT', 'DNI', 'Pasaporte', 'Otro'],
  'Ecuador': ['RUC', 'Cédula', 'Pasaporte', 'Otro'],
  'Panamá': ['RUC', 'Cédula', 'Pasaporte', 'Otro'],
  'República Dominicana': ['RNC', 'Cédula', 'Pasaporte', 'Otro'],
  'Venezuela': ['RIF', 'Cédula', 'Pasaporte', 'Otro'],
  'Bolivia': ['NIT', 'Cédula de identidad', 'Pasaporte', 'Otro'],
  'Paraguay': ['RUC', 'Cédula', 'Pasaporte', 'Otro'],
  'Uruguay': ['RUT', 'Cédula de identidad', 'Pasaporte', 'Otro'],
  'Costa Rica': ['Cédula jurídica', 'Cédula física', 'Pasaporte', 'Otro'],
  'Guatemala': ['NIT', 'DPI', 'Pasaporte', 'Otro'],
  'Honduras': ['RTN', 'Identidad', 'Pasaporte', 'Otro'],
  'El Salvador': ['NIT', 'DUI', 'Pasaporte', 'Otro'],
  'Nicaragua': ['RUC', 'Cédula', 'Pasaporte', 'Otro'],
};

const GENERICO: readonly string[] = ['Pasaporte', 'Documento extranjero', 'Otro'];

/** Tipos para un país. Cualquiera fuera de la lista cae en el genérico. */
export function tiposIdentificacionPara(pais: string): readonly string[] {
  return TIPOS_POR_PAIS[pais] ?? GENERICO;
}

/**
 * Los tipos que debe mostrar el desplegable, incluyendo el valor ya guardado
 * aunque no esté en el catálogo.
 *
 * Hace falta por las cuentas antiguas: en producción hay usuarios creados desde
 * el propio panel con `CC`, `CE` o `ID Extranjero`, que ya no existen. Sin esto
 * el desplegable saldría vacío para ellos y el primer guardado les borraría el
 * tipo sin que nadie lo note.
 */
export function tiposConValorActual(
  pais: string,
  valorActual: string | null | undefined,
): readonly string[] {
  const tipos = tiposIdentificacionPara(pais);
  if (!valorActual || tipos.includes(valorActual)) return tipos;
  return [...tipos, valorActual];
}
