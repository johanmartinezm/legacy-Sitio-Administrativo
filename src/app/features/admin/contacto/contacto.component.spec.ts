import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContactoComponent } from './contacto.component';
import { ConfigService } from '../../../core/services/config.service';
import { MensajeDeContacto } from '../../../core/models/contacto.model';

class ConfigServiceFalso {
  get apiUrl(): string {
    return 'http://api-de-prueba';
  }
}

const mensaje = (extra: Partial<MensajeDeContacto> = {}): MensajeDeContacto => ({
  id: 'msg-1',
  user_id: 'user-1',
  asunto: 'No puedo inscribirme',
  mensaje: 'Al pulsar reservar no pasa nada',
  estado: 'nuevo',
  email_enviado: true,
  created_at: '2026-08-13T10:00:00Z',
  updated_at: '2026-08-13T10:00:00Z',
  remitente_nombre: 'Ana Ruiz',
  remitente_email: 'ana@ejemplo.com',
  ...extra,
});

describe('ContactoComponent', () => {
  let fixture: ComponentFixture<ContactoComponent>;
  let component: ContactoComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactoComponent, HttpClientTestingModule],
      providers: [{ provide: ConfigService, useClass: ConfigServiceFalso }],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactoComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('arranca pidiendo solo los mensajes nuevos, que son los que hay que atender', () => {
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url === 'http://api-de-prueba/api/admin/contacto');
    expect(req.request.params.get('estado')).toBe('nuevo');
    req.flush([mensaje()]);

    expect(component.mensajes.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('el filtro "Todos" no manda estado, para que el backend no filtre', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/admin/contacto')).flush([]);

    component.cambiarFiltro('all');

    const req = http.expectOne((r) => r.url === 'http://api-de-prueba/api/admin/contacto');
    expect(req.request.params.has('estado')).toBeFalse();
    req.flush([]);
  });

  it('abrir un mensaje nuevo lo marca como leído', () => {
    fixture.detectChanges();
    const m = mensaje();
    http.expectOne((r) => r.url.includes('/api/admin/contacto')).flush([m]);

    component.alternar(m);

    const req = http.expectOne('http://api-de-prueba/api/admin/contacto/msg-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'leido' });
    req.flush(null);

    expect(m.estado).toBe('leido');
  });

  it('cerrar un mensaje no vuelve a cambiar su estado', () => {
    fixture.detectChanges();
    const m = mensaje({ estado: 'leido' });
    http.expectOne((r) => r.url.includes('/api/admin/contacto')).flush([m]);

    component.alternar(m); // abrir: ya está leído, no debe llamar
    expect(component.abierto).toBe('msg-1');

    component.alternar(m); // cerrar
    expect(component.abierto).toBeNull();
    expect(m.estado).toBe('leido');

    http.expectNone('http://api-de-prueba/api/admin/contacto/msg-1');
  });

  it('si el cambio de estado falla, se deja el estado anterior', () => {
    fixture.detectChanges();
    const m = mensaje();
    http.expectOne((r) => r.url.includes('/api/admin/contacto')).flush([m]);

    component.marcar(m, 'respondido');
    expect(m.estado).toBe('respondido'); // se pinta antes de responder el servidor

    http
      .expectOne('http://api-de-prueba/api/admin/contacto/msg-1')
      .flush(null, { status: 500, statusText: 'Server Error' });

    // Dejarlo en "respondido" haría creer que se atendió algo que no se guardó.
    expect(m.estado).toBe('nuevo');
    expect(component.error).toBe('No se pudo actualizar el estado');
  });

  it('un 403 dice que hace falta ser administrador', () => {
    fixture.detectChanges();

    http
      .expectOne((r) => r.url.includes('/api/admin/contacto'))
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(component.error).toBe('Esta información es solo para administradores');
    expect(component.loading).toBeFalse();
  });
});
