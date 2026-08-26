import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

/**
 * El nombre de un administrador **nunca se guardaba ni se mostraba**: el panel
 * enviaba `firstName`/`lastName` y el backend lee `first_name`/`last_name`
 * (payload de `RegisterAdmin` y `domain.AdminUser`), así que escribía la cadena
 * vacía. Los tres administradores de producción tenían el nombre en blanco y la
 * lista los pintaba vacíos. `email` y `role` funcionaban por ser una sola
 * palabra, que es lo que ocultaba el fallo.
 */
describe('AdminService · nombres', () => {
    let service: AdminService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/admin';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AdminService]
        });
        service = TestBed.inject(AdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lee el nombre del listado', () => {
        service.listAdmins().subscribe(admins => {
            expect(admins[0].firstName).toBe('Oscar');
            expect(admins[0].lastName).toBe('García');
        });

        const req = httpMock.expectOne(`${apiUrl}/users`);
        req.flush([{
            id: '1', email: 'oscar.garcia@intelyclick.com',
            first_name: 'Oscar', last_name: 'García', role: 'admin'
        }]);
    });

    it('envia el nombre en snake_case al guardar', () => {
        service.updateAdmin('1', { email: 'a@b.co', firstName: 'Oscar', lastName: 'García', role: 'admin' }).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/users/1`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body.first_name).toBe('Oscar');
        expect(req.request.body.last_name).toBe('García');
        // Lo que se enviaba antes y el backend ignoraba en silencio.
        expect(req.request.body.firstName).toBeUndefined();
        req.flush({ id: '1', first_name: 'Oscar', last_name: 'García', role: 'admin' });
    });

    it('envia el nombre en snake_case al crear, con la contrasena aparte', () => {
        service.registerAdmin({
            email: 'nuevo@legacy.co', password: 'secreta123',
            firstName: 'Ana', lastName: 'Ruiz', role: 'admin'
        }).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/register`);
        expect(req.request.body.first_name).toBe('Ana');
        expect(req.request.body.last_name).toBe('Ruiz');
        expect(req.request.body.password).toBe('secreta123');
        req.flush({ message: 'admin created' });
    });

    it('un administrador sin nombre no rompe la lista', () => {
        // Los tres de producción están así hasta que alguien los reedite.
        service.listAdmins().subscribe(admins => {
            expect(admins[0].firstName).toBe('');
            expect(admins[0].lastName).toBe('');
        });

        const req = httpMock.expectOne(`${apiUrl}/users`);
        req.flush([{ id: '1', email: 'admin@legacy.com', role: 'superadmin' }]);
    });
});
