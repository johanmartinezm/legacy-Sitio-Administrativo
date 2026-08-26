import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { Event } from '../models/event.model';

/**
 * La columna `status` decide si un evento se ve en la app. Hasta el 2026-08-26
 * el panel no la conocia: un evento oculto se listaba aqui igual que los demas,
 * y no habia forma de reactivarlo mas que por SQL —mandar `"status"` en el PUT
 * del evento devolvia 200 sin cambiar nada—.
 *
 * Las dos propiedades que se fijan aqui:
 *   1. el estado se lee del listado, para poder pintarlo;
 *   2. cambiarlo va por su propia ruta, y el PUT del formulario NO lo envia
 *      —si lo enviara vacio, el evento desapareceria de la app al guardarlo—.
 */
describe('EventService · visibilidad del evento', () => {
    let service: EventService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/events';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [EventService]
        });
        service = TestBed.inject(EventService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lee el estado de cada evento del listado', () => {
        service.getEvents().subscribe(events => {
            expect(events[0].status).toBe('active');
            expect(events[1].status).toBe('inactive');
        });

        const req = httpMock.expectOne(apiUrl);
        req.flush([
            { id: '1', title: 'Legacy Summit', status: 'active', workshops: [] },
            { id: '2', title: 'Verificación interna', status: 'inactive', workshops: [] }
        ]);
    });

    it('da por visible un evento cuyo DTO no traiga estado', () => {
        // Un backend anterior al cambio no devuelve el campo. Suponerlo oculto
        // pintaria "Oculto" sobre eventos que la app si esta mostrando.
        service.getEvents().subscribe(events => {
            expect(events[0].status).toBe('active');
        });

        const req = httpMock.expectOne(apiUrl);
        req.flush([{ id: '1', title: 'Legacy Summit', workshops: [] }]);
    });

    it('oculta un evento por su propia ruta', () => {
        service.updateStatus('evt-1', 'inactive').subscribe();

        const req = httpMock.expectOne(`${apiUrl}/evt-1/status`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ status: 'inactive' });
        req.flush({ id: 'evt-1', status: 'inactive' });
    });

    it('vuelve a mostrar un evento oculto', () => {
        service.updateStatus('evt-1', 'active').subscribe();

        const req = httpMock.expectOne(`${apiUrl}/evt-1/status`);
        expect(req.request.body).toEqual({ status: 'active' });
        req.flush({ id: 'evt-1', status: 'active' });
    });

    it('guardar el formulario no envia el estado', () => {
        // Es la propiedad que impide la regresion: si el PUT del evento
        // llevara `status`, el formulario —que no tiene ese campo— lo mandaria
        // vacio y el evento dejaria de verse en la app al editarlo.
        const evento = {
            id: 'evt-1',
            title: 'Legacy Summit',
            description: '',
            imageUrl: '',
            category: '',
            categoryId: '',
            workshops: [],
            price: 0,
            isFree: true,
            buttonText: '',
            actionStatus: 'register',
            includes: '',
            status: 'inactive'
        } as Event;

        service.updateEvent(evento).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/evt-1`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body.status).toBeUndefined();
        req.flush({ id: 'evt-1', title: 'Legacy Summit' });
    });
});
