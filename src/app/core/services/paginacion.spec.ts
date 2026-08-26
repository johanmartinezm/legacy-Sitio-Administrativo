import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { EventService } from './event.service';

/**
 * Los listados del panel se traían enteros. En el caso de usuarios e inscritos
 * eso no costaba solo la respuesta: **el backend descifra cada fila**, así que
 * el trabajo crecía con el número de cuentas, no con lo que se ve en pantalla.
 *
 * El total viaja en la cabecera `X-Total-Count` y no dentro del cuerpo, porque
 * la respuesta sigue siendo un array plano: hay una app publicada que lo
 * recorre directamente y envolverla la rompería.
 */
describe('Paginación de los listados del panel', () => {
    let httpMock: HttpTestingController;
    const usersUrl = 'http://localhost:8080/api/users';
    const eventsUrl = 'http://localhost:8080/api/events';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [UserService, EventService]
        });
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    describe('UserService.getUsersPage', () => {
        it('pide la página y lee el total de la cabecera', () => {
            const service = TestBed.inject(UserService);

            service.getUsersPage(25, 50).subscribe(pagina => {
                expect(pagina.items.length).toBe(1);
                expect(pagina.total).toBe(342);
            });

            const req = httpMock.expectOne(r => r.url === usersUrl);
            expect(req.request.params.get('limit')).toBe('25');
            expect(req.request.params.get('offset')).toBe('50');
            req.flush([{ id: '1', first_name: 'Ana', last_name: 'Ruiz' }], {
                headers: { 'X-Total-Count': '342' }
            });
        });

        it('sin cabecera cae al largo de la página, no a cero', () => {
            // Un backend anterior al cambio no la manda. Con total 0 el
            // paginador diría que no hay resultados mientras se ven filas.
            const service = TestBed.inject(UserService);

            service.getUsersPage(25, 0).subscribe(pagina => {
                expect(pagina.total).toBe(2);
            });

            const req = httpMock.expectOne(r => r.url === usersUrl);
            req.flush([{ id: '1' }, { id: '2' }]);
        });
    });

    describe('UserService.getUsers', () => {
        it('recorre todas las páginas y devuelve la lista completa', () => {
            // Tres pantallas dependen de esto: el selector de miembros de un
            // grupo, el envío de notificaciones y el selector de inscripción.
            // Si devolviera solo la primera página, se callarían a la gente que
            // no cupiera sin que nada lo avisara.
            const service = TestBed.inject(UserService);

            service.getUsers().subscribe(users => {
                expect(users.length).toBe(250);
            });

            const primera = httpMock.expectOne(r => r.url === usersUrl && r.params.get('offset') === '0');
            expect(primera.request.params.get('limit')).toBe('200');
            req200(primera, 0, 250);

            const segunda = httpMock.expectOne(r => r.url === usersUrl && r.params.get('offset') === '200');
            req200(segunda, 200, 250);
        });

        it('se detiene con una página vacía aunque el total mienta', () => {
            // Sin esta guarda, un total mal calculado en el servidor dejaría el
            // bucle pidiendo páginas para siempre.
            const service = TestBed.inject(UserService);

            service.getUsers().subscribe(users => {
                expect(users.length).toBe(1);
            });

            const primera = httpMock.expectOne(r => r.url === usersUrl && r.params.get('offset') === '0');
            primera.flush([{ id: '1' }], { headers: { 'X-Total-Count': '99999' } });

            const segunda = httpMock.expectOne(r => r.url === usersUrl && r.params.get('offset') === '200');
            segunda.flush([], { headers: { 'X-Total-Count': '99999' } });
        });
    });

    describe('EventService.getAllEventRegistrants', () => {
        it('junta todas las páginas de inscritos', () => {
            // La pantalla calcula lo recaudado sobre esta lista: con una página
            // suelta mostraría una fracción del dinero sin avisar.
            const service = TestBed.inject(EventService);

            service.getAllEventRegistrants('evt-1').subscribe(lista => {
                expect(lista.length).toBe(201);
            });

            const url = `${eventsUrl}/evt-1/registrations`;
            const primera = httpMock.expectOne(r => r.url === url && r.params.get('offset') === '0');
            primera.flush(
                Array.from({ length: 200 }, (_, i) => ({ registrationID: `r${i}`, registrationDate: '2026-08-01T00:00:00Z' })),
                { headers: { 'X-Total-Count': '201' } }
            );

            const segunda = httpMock.expectOne(r => r.url === url && r.params.get('offset') === '200');
            segunda.flush(
                [{ registrationID: 'r200', registrationDate: '2026-08-01T00:00:00Z' }],
                { headers: { 'X-Total-Count': '201' } }
            );
        });
    });

    function req200(req: any, desde: number, total: number) {
        const filas = Array.from({ length: Math.min(200, total - desde) }, (_, i) => ({ id: `u${desde + i}` }));
        req.flush(filas, { headers: { 'X-Total-Count': String(total) } });
    }
});
