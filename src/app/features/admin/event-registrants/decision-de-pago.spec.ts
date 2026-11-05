import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EventRegistrantsComponent } from './event-registrants.component';
import { ConfigService } from '../../../core/services/config.service';
import { EventRegistrant } from '../../../core/models/registrant.model';

class ConfigServiceFalso {
  get apiUrl(): string {
    return 'http://api-de-prueba';
  }
}

const inscrito = (id: string, estado: string, extra: Partial<EventRegistrant> = {}): EventRegistrant => ({
  registrationId: id,
  userId: 'u-' + id,
  fullName: 'Persona ' + id,
  email: id + '@example.com',
  phone: '',
  paymentStatus: estado === 'confirmed' ? 'paid' : 'pending',
  registrationStatus: estado,
  registrationDate: new Date(),
  totalPaid: estado === 'confirmed' ? 100 : 0,
  attendanceConfirmed: false,
  tieneCredencial: true,
  workshops: [],
  ...extra,
});

/**
 * Parte B del plan de workshops: aprobar o rechazar el pago desde «Inscritos»,
 * y que una rechazada no cuente como inscrita ni como con credencial.
 */
describe('EventRegistrantsComponent · decisión de pago', () => {
  let fixture: ComponentFixture<EventRegistrantsComponent>;
  let component: EventRegistrantsComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventRegistrantsComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ConfigService, useClass: ConfigServiceFalso },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'ev-1' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventRegistrantsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  /** Responde todo lo que pida la pantalla al arrancar, con estos inscritos. */
  function cargar(lista: EventRegistrant[]) {
    fixture.detectChanges();
    for (const req of http.match(() => true)) {
      req.flush(req.request.url.includes('/registrations') ? lista : { id: 'ev-1', title: 'Evento', workshops: [] },
        { headers: { 'X-Total-Count': String(lista.length) } });
    }
    fixture.detectChanges();
  }

  it('una rechazada no cuenta como inscrita y se distingue', () => {
    cargar([inscrito('a', 'confirmed'), inscrito('b', 'pending_payment'), inscrito('c', 'rejected')]);

    expect(component.total()).toBe(2);
    expect(component.pendientes()).toBe(1);
    expect(component.rechazadas()).toBe(1);
    expect(component.sinCredencial()).toBe(0);
    expect(component.estadoTexto(inscrito('c', 'rejected'))).toBe('Rechazada');
    expect(fixture.nativeElement.textContent).toContain('Rechazadas');
  });

  it('solo con rechazadas, la tabla sigue a la vista', () => {
    cargar([inscrito('c', 'rejected')]);
    expect(component.total()).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Todavia nadie se ha inscrito');
    expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row').length).toBe(1);
  });

  it('aprobar pregunta antes y llama al servidor', () => {
    cargar([inscrito('b', 'pending_payment')]);
    spyOn(window, 'confirm').and.returnValue(true);

    component.aprobar(inscrito('b', 'pending_payment'));

    const req = http.expectOne('http://api-de-prueba/api/registrations/b/aprobar');
    expect(req.request.method).toBe('POST');
    req.flush({ registrationId: 'b', registrationStatus: 'confirmed', paymentStatus: 'paid' });
    // Recarga la lista para verla como quedó.
    expect(http.match(r => r.url.includes('/events/ev-1/registrations')).length).toBeGreaterThan(0);
  });

  it('cancelar la confirmación no rechaza nada', () => {
    cargar([inscrito('b', 'pending_payment')]);
    spyOn(window, 'confirm').and.returnValue(false);

    component.rechazar(inscrito('b', 'pending_payment'));

    http.expectNone('http://api-de-prueba/api/registrations/b/rechazar');
  });

  it('los botones solo salen en las pendientes', () => {
    cargar([inscrito('a', 'confirmed'), inscrito('b', 'pending_payment'), inscrito('c', 'rejected')]);
    const filas: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row'));
    const conBotones = filas.filter(f => f.querySelector('.mat-column-decision button'));
    expect(conBotones.length).toBe(1);
    expect(conBotones[0].textContent).toContain('Persona b');
  });
});
