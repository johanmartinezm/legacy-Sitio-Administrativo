import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatosDelTaller, WorkshopFormDialogComponent } from './workshop-form-dialog.component';

/**
 * El workshop tiene que estar dentro de las fechas del evento (2026-11-06): uno
 * de antes habilitaba la calificación y el material en la app antes de que el
 * evento empezara. El backend lo rechaza; aquí se ve junto a los campos.
 */
describe('WorkshopFormDialogComponent: fechas del evento', () => {
  let cerrado: any;

  function crear(data: DatosDelTaller): WorkshopFormDialogComponent {
    cerrado = undefined;
    const ref = { close: (v: any) => (cerrado = v) } as MatDialogRef<WorkshopFormDialogComponent>;
    return new WorkshopFormDialogComponent(new FormBuilder(), ref, data);
  }

  function llenar(c: WorkshopFormDialogComponent, inicio: Date, fin: Date) {
    c.form.patchValue({
      name: 'Protocolo', room: 'Sala 1', speaker: 'Ana Ruiz',
      startDate: inicio, startTime: '09:00', endDate: fin, endTime: '10:00',
    });
  }

  const evento = { inicioDelEvento: new Date(2026, 10, 18), finDelEvento: new Date(2026, 10, 20) };

  it('propone el primer día y acota los calendarios al evento', () => {
    const c = crear(evento);
    expect(c.form.value.startDate.getDate()).toBe(18);
    expect(c.minFecha?.getDate()).toBe(18);
    expect(c.maxFecha?.getDate()).toBe(20);
    expect(c.fechasDelEvento).toBe('del 18/11/2026 al 20/11/2026');
  });

  it('acepta el primer y el último día', () => {
    const c = crear(evento);
    llenar(c, new Date(2026, 10, 18), new Date(2026, 10, 20));
    expect(c.form.hasError('fueraDelEvento')).toBeFalse();
    c.save();
    expect(cerrado).toBeTruthy();
  });

  it('rechaza un workshop antes o después del evento y no lo devuelve', () => {
    for (const [inicio, fin] of [
      [new Date(2026, 9, 26), new Date(2026, 9, 26)],
      [new Date(2026, 10, 20), new Date(2026, 10, 21)],
    ]) {
      const c = crear(evento);
      llenar(c, inicio, fin);
      expect(c.form.hasError('fueraDelEvento')).withContext(String(inicio)).toBeTrue();
      c.save();
      expect(cerrado).toBeUndefined();
    }
  });

  it('un evento sin fecha de fin es de un solo día', () => {
    const c = crear({ inicioDelEvento: new Date(2026, 10, 18) });
    expect(c.fechasDelEvento).toBe('el 18/11/2026');
    llenar(c, new Date(2026, 10, 19), new Date(2026, 10, 19));
    expect(c.form.hasError('fueraDelEvento')).toBeTrue();
  });

  it('al editar un workshop que ya estaba fuera de fechas, obliga a corregirlo', () => {
    const c = crear({
      ...evento,
      workshop: {
        id: 'ws-1', name: 'Protocolo', room: 'Sala 1', speaker: 'Ana Ruiz',
        startDateTime: new Date(2026, 9, 26, 10), endDateTime: new Date(2026, 9, 26, 11),
      },
    });
    expect(c.form.hasError('fueraDelEvento')).toBeTrue();
  });
});
