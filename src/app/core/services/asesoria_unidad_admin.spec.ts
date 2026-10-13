import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AsesoriaUnidadAdminService } from './asesoria_unidad_admin.service';
import { AsesoriaUnidad } from '../models/asesoria-unidad.model';

describe('AsesoriaUnidadAdminService', () => {
    let service: AsesoriaUnidadAdminService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/admin/asesoria/unidades';
    const unidad: AsesoriaUnidad = {
        titulo: 'Aurum', subtitulo: 'Finanzas', icono: 'crecimiento', necesidad: 'Patrimonio', orden: 20, activa: true
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AsesoriaUnidadAdminService]
        });
        service = TestBed.inject(AsesoriaUnidadAdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('lista, crea, edita y borra contra /api/admin/asesoria/unidades', () => {
        service.listAll().subscribe();
        expect(httpMock.expectOne(apiUrl).request.method).toBe('GET');

        service.create(unidad).subscribe();
        const crear = httpMock.expectOne(apiUrl);
        expect(crear.request.method).toBe('POST');
        expect(crear.request.body).toEqual(unidad);

        service.update('abc', unidad).subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('PUT');

        service.delete('abc').subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('DELETE');
    });
});
