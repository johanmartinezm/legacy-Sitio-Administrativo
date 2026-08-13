import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImageUploadService } from './image-upload.service';
import { ConfigService } from './config.service';

/// La URL de la API se resuelve en tiempo de ejecución con un APP_INITIALIZER;
/// en las pruebas se fija a mano.
class ConfigFalso {
    get apiUrl(): string {
        return 'https://api.ejemplo.test';
    }
}

function archivo(nombre: string, tipo: string, bytes: number): File {
    const contenido = new Uint8Array(bytes);
    return new File([contenido], nombre, { type: tipo });
}

describe('ImageUploadService', () => {
    let servicio: ImageUploadService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                ImageUploadService,
                { provide: ConfigService, useClass: ConfigFalso }
            ]
        });
        servicio = TestBed.inject(ImageUploadService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('envía el archivo en el campo que espera el backend', () => {
        servicio.subir(archivo('foto.jpg', 'image/jpeg', 10)).subscribe();

        const req = http.expectOne('https://api.ejemplo.test/api/images/upload');
        expect(req.request.method).toBe('POST');
        // El backend lee r.FormFile("file"): cualquier otro nombre da 400.
        expect((req.request.body as FormData).get('file')).toBeTruthy();
        req.flush({ name: 'uuid_foto.jpg' });
    });

    it('devuelve la URL absoluta, que es lo que guardan los formularios', () => {
        let url: string | undefined;
        servicio.subir(archivo('foto.jpg', 'image/jpeg', 10)).subscribe(u => (url = u));

        http.expectOne('https://api.ejemplo.test/api/images/upload')
            .flush({ name: 'uuid_foto.jpg' });

        // Absoluta y no el nombre suelto: es lo que la app pinta tal cual.
        expect(url).toBe('https://api.ejemplo.test/api/images/uuid_foto.jpg');
    });

    describe('validación previa', () => {
        it('acepta una imagen normal', () => {
            expect(servicio.validar(archivo('foto.png', 'image/png', 1024))).toBeNull();
        });

        it('rechaza lo que no es imagen', () => {
            expect(servicio.validar(archivo('doc.pdf', 'application/pdf', 10)))
                .toBe('El archivo debe ser una imagen.');
        });

        it('rechaza por encima de 10 MB, el límite del servidor', () => {
            const grande = archivo('foto.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1);
            expect(servicio.validar(grande)).toBe('La imagen supera los 10 MB.');
        });

        it('acepta justo en el límite', () => {
            const justo = archivo('foto.jpg', 'image/jpeg', 10 * 1024 * 1024);
            expect(servicio.validar(justo)).toBeNull();
        });
    });
});
