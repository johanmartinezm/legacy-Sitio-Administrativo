import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SeccionInicioAdminService } from './seccion_inicio_admin.service';

/**
 * El panel cambia imagen, título y texto de cada tarjeta del Inicio. El PUT
 * lleva solo los campos que se cambian: quitar la imagen es mandarla vacía sin
 * tocar los textos.
 */
describe('SeccionInicioAdminService', () => {
    let service: SeccionInicioAdminService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/admin/inicio/secciones';

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [SeccionInicioAdminService]
        });
        service = TestBed.inject(SeccionInicioAdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('lista las secciones', () => {
        service.listAll().subscribe(secciones => {
            expect(secciones.length).toBe(1);
            expect(secciones[0].slug).toBe('eventos');
        });

        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('GET');
        req.flush([{ slug: 'eventos', nombre: 'Eventos', orden: 40, imagen_url: '', titulo: '', texto: '' }]);
    });

    it('guardar manda imagen, título y texto a la sección de la ruta', () => {
        service.actualizar('eventos', {
            imagen_url: 'https://app.legacynetworkco.com/api/images/a.jpg',
            titulo: 'Agenda 2026',
            texto: ''
        }).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/eventos`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({
            imagen_url: 'https://app.legacynetworkco.com/api/images/a.jpg',
            titulo: 'Agenda 2026',
            texto: ''
        });
        req.flush({});
    });

    it('quitar la imagen la manda vacía y no toca los textos', () => {
        service.actualizar('beneficios', { imagen_url: '' }).subscribe();

        const req = httpMock.expectOne(`${apiUrl}/beneficios`);
        expect(req.request.body).toEqual({ imagen_url: '' });
        req.flush({});
    });
});
