import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EventWorkshopsComponent } from './event-workshops.component';
import { ConfigService } from '../../../core/services/config.service';
import { Workshop } from '../../../core/models/event.model';

class ConfigServiceFalso {
  get apiUrl(): string {
    return 'http://api-de-prueba';
  }
}

const taller = (extra: Partial<Workshop> = {}): Workshop => ({
  id: 'ws-1',
  name: 'Protocolo',
  room: 'Sala 1',
  speaker: 'Ana Ruiz',
  startDateTime: new Date('2026-12-10T09:00:00-05:00'),
  endDateTime: new Date('2026-12-10T10:30:00-05:00'),
  ...extra,
});

/**
 * §10 del plan de workshops (2026-11-05): la pantalla de talleres muestra cuántos
 * inscritos eligió cada uno y avisa, sin impedir, al agregar o mover un taller
 * en un evento que ya tiene inscritos.
 */
describe('EventWorkshopsComponent', () => {
  let fixture: ComponentFixture<EventWorkshopsComponent>;
  let component: EventWorkshopsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventWorkshopsComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ConfigService, useClass: ConfigServiceFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'ev-1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventWorkshopsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function cargar(inscritos: number, elegidos: Record<string, number>) {
    fixture.detectChanges();
    http.expectOne('http://api-de-prueba/api/events/ev-1').flush({
      id: 'ev-1', title: 'Evento', date: '2026-12-10', workshops: [taller()],
    });
    http.expectOne('http://api-de-prueba/api/events/ev-1/workshops/resumen').flush({ inscritos, elegidos });
    fixture.detectChanges();
  }

  const confirma = (nuevo: Workshop, anterior?: Workshop): boolean =>
    (component as any).confirmaCambioDeHorario(nuevo, anterior);

  it('muestra cuántos inscritos eligieron cada taller', () => {
    cargar(3, { 'ws-1': 2 });

    expect(component.elegidosDe(taller())).toBe(2);
    expect(component.elegidosDe(taller({ id: 'otro' }))).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Elegido por');
  });

  it('sin inscritos guarda sin preguntar', () => {
    cargar(0, {});
    const pregunta = spyOn(window, 'confirm');

    expect(confirma(taller({ id: '' }))).toBeTrue();
    expect(pregunta).not.toHaveBeenCalled();
  });

  it('con inscritos, agregar un taller pregunta, y cancelar no guarda', () => {
    cargar(2, {});
    const pregunta = spyOn(window, 'confirm').and.returnValue(false);

    expect(confirma(taller({ id: '' }))).toBeFalse();
    expect(pregunta.calls.mostRecent().args[0]).toContain('2 inscritos');
  });

  it('editar sin cambiar el horario no pregunta; moverlo sí', () => {
    cargar(1, {});
    const pregunta = spyOn(window, 'confirm').and.returnValue(true);

    expect(confirma(taller({ name: 'Otro nombre' }), taller())).toBeTrue();
    expect(pregunta).not.toHaveBeenCalled();

    const movido = taller({ startDateTime: new Date('2026-12-10T11:00:00-05:00') });
    expect(confirma(movido, taller())).toBeTrue();
    expect(pregunta).toHaveBeenCalledTimes(1);
    expect(pregunta.calls.mostRecent().args[0]).toContain('Cambiar el horario');
  });
});
