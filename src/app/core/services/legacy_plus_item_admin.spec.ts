import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LegacyPlusItemAdminService } from './legacy_plus_item_admin.service';
import { LegacyPlusItem } from '../models/legacy-plus-item.model';

describe('LegacyPlusItemAdminService', () => {
    let service: LegacyPlusItemAdminService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:8080/api/admin/legacy-plus/items';
    const item: LegacyPlusItem = { grupo: 'beneficios', titulo: 'Aliados', texto: 'Vitalea', orden: 20, activo: true };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [LegacyPlusItemAdminService]
        });
        service = TestBed.inject(LegacyPlusItemAdminService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('lista, crea, edita y borra contra /api/admin/legacy-plus/items', () => {
        service.listAll().subscribe();
        expect(httpMock.expectOne(apiUrl).request.method).toBe('GET');

        service.create(item).subscribe();
        const crear = httpMock.expectOne(apiUrl);
        expect(crear.request.method).toBe('POST');
        expect(crear.request.body).toEqual(item);

        service.update('abc', item).subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('PUT');

        service.delete('abc').subscribe();
        expect(httpMock.expectOne(`${apiUrl}/abc`).request.method).toBe('DELETE');
    });
});
