import { escribirFechaDeEvento, leerFechaDeEvento } from './fecha-de-evento';

describe('fecha de evento', () => {
  it('lee el día que manda el backend, no el anterior', () => {
    const d = leerFechaDeEvento('2026-12-10T00:00:00Z')!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(10);
  });

  it('acepta el día a secas y deja vacío lo que no es fecha', () => {
    expect(leerFechaDeEvento('2026-12-11')!.getDate()).toBe(11);
    expect(leerFechaDeEvento('')).toBeUndefined();
    expect(leerFechaDeEvento(undefined)).toBeUndefined();
  });

  it('escribe el día del calendario como medianoche UTC', () => {
    expect(escribirFechaDeEvento(new Date(2026, 11, 10))).toBe('2026-12-10T00:00:00Z');
    expect(escribirFechaDeEvento(undefined)).toBeUndefined();
  });

  it('leer y escribir no corre el día', () => {
    const ida = '2026-01-01T00:00:00Z';
    expect(escribirFechaDeEvento(leerFechaDeEvento(ida))).toBe(ida);
  });
});
