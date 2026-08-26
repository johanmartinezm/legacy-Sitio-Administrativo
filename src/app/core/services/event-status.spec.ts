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

    // La modalidad se perdia en los dos sentidos: no se leia del DTO, asi que
    // abrir a editar una masterclass virtual pintaba la casilla desmarcada; y no
    // se enviaba en el PUT, asi que el backend —que escribe is_virtual y
    // access_url siempre— la convertia en presencial y borraba el enlace de la
    // sesion. Quien se inscribiera despues recibia QR en vez del enlace.
    it('lee la modalidad y el enlace de la sesion', () => {
        service.getEventById('evt-1').subscribe(evento => {
            expect(evento.isVirtual).toBe(true);
            expect(evento.accessUrl).toBe('https://legacynetworkco.com/aula');
        });

        const req = httpMock.expectOne(`${apiUrl}/evt-1`);
        req.flush({
            id: 'evt-1', title: 'Masterclass', workshops: [],
            isVirtual: true, accessUrl: 'https://legacynetworkco.com/aula'
        });
    });

    it('da por presencial un evento cuyo DTO no traiga modalidad', () => {
        service.getEventById('evt-1').subscribe(evento => {
            expect(evento.isVirtual).toBe(false);
            expect(evento.accessUrl).toBeNull();
        });

        const req = httpMock.expectOne(`${apiUrl}/evt-1`);
        req.flush({ id: 'evt-1', title: 'Encuentro', workshops: [] });
    });

    it('guardar un evento virtual conserva la modalidad y el enlace', () => {
        const evento = {
            id: 'evt-1', title: 'Masterclass', description: '', imageUrl: '',
            category: '', categoryId: '', workshops: [], price: 0, isFree: true,
            buttonText: '', actionStatus: 'register', includes: '',
            isVirtual: true, accessUrl: 'https://legacynetworkco.com/aula'
        } as Event;

        service.updateEvent(evento).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/evt-1`);
        expect(req.request.body.isVirtual).toBe(true);
        expect(req.request.body.accessUrl).toBe('https://legacynetworkco.com/aula');
        req.flush({ id: 'evt-1' });
    });

    it('un presencial se guarda sin enlace', () => {
        const evento = {
            id: 'evt-1', title: 'Encuentro', description: '', imageUrl: '',
            category: '', categoryId: '', workshops: [], price: 0, isFree: true,
            buttonText: '', actionStatus: 'register', includes: '',
            isVirtual: false, accessUrl: null
        } as Event;

        service.updateEvent(evento).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/evt-1`);
        expect(req.request.body.isVirtual).toBe(false);
        expect(req.request.body.accessUrl).toBeNull();
        req.flush({ id: 'evt-1' });
    });

    it('crear un evento virtual tambien lleva la modalidad', () => {
        // Mismo mapeo que el guardado, asi que se perdia igual al crear.
        const evento = {
            id: '', title: 'Masterclass', description: '', imageUrl: '',
            category: '', categoryId: '', workshops: [], price: 0, isFree: true,
            buttonText: '', actionStatus: 'register', includes: '',
            isVirtual: true, accessUrl: 'https://legacynetworkco.com/aula'
        } as Event;

        service.createEvent(evento).subscribe();

        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body.isVirtual).toBe(true);
        expect(req.request.body.accessUrl).toBe('https://legacynetworkco.com/aula');
        req.flush({ id: 'evt-9' });
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
