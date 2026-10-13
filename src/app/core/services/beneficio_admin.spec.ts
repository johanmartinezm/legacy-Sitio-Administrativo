import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BeneficioAdminService } from './beneficio_admin.service';
import { Beneficio } from '../models/beneficio.model';

describe('BeneficioAdminService', () => {
    let service: BeneficioAdminService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/admin/beneficios';
    const alianza: Beneficio = {
        tipo: 'alianza', titulo: 'JW Marriott', descripcion: 'Tarifa especial',
        imagen_url: '', enlace_url: 'https://marriott.com', orden: 10, activo: true
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [BeneficioAdminService]
        });
        service = TestBed.inject(BeneficioAdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('lista, crea (con su tipo), edita y borra contra /api/admin/beneficios', () => {
        service.listAll().subscribe();
        expect(httpMock.expectOne(apiUrl).request.method).toBe('GET');

        service.create(alianza).subscribe();
        const crear = httpMock.expectOne(apiUrl);
        expect(crear.request.method).toBe('POST');
        expect(crear.request.body.tipo).toBe('alianza');

        service.update('abc', alianza).subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('PUT');

        service.delete('abc').subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('DELETE');
    });
});
