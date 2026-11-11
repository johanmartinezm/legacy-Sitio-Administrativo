import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { BannerListComponent } from './banner-list.component';
import { BannerAdminService } from '../../../../core/services/banner_admin.service';
import { SeccionInicioAdminService } from '../../../../core/services/seccion_inicio_admin.service';
import { SeccionInicio } from '../../../../core/models/seccion-inicio.model';

/**
 * El interruptor «Mostrar el carrusel en el Inicio de la app» (2026-11-11).
 * Lo que se protege: que refleje lo guardado, que mande solo `visible`, y que
 * no se quede diciendo algo que no llegó a guardarse.
 */
describe('BannerListComponent · carrusel del Inicio', () => {
    const fila = (visible: boolean): SeccionInicio => ({
        slug: 'carrusel-inicio', nombre: 'Carrusel', orden: 5,
        pantalla: 'banners' as never, imagen_url: '', titulo: '', texto: '', visible
    });

    let secciones: jasmine.SpyObj<SeccionInicioAdminService>;

    function crear(guardadas: SeccionInicio[]) {
        secciones = jasmine.createSpyObj('SeccionInicioAdminService', ['listAll', 'actualizar']);
        secciones.listAll.and.returnValue(of(guardadas));
        const banners = jasmine.createSpyObj('BannerAdminService', ['listAll']);
        banners.listAll.and.returnValue(of([]));

        TestBed.configureTestingModule({
            imports: [BannerListComponent, NoopAnimationsModule],
            providers: [
                { provide: BannerAdminService, useValue: banners },
                { provide: SeccionInicioAdminService, useValue: secciones }
            ]
        });
        const fixture = TestBed.createComponent(BannerListComponent);
        fixture.detectChanges();
        return fixture;
    }

    const cambio = (checked: boolean) =>
        ({ checked, source: { checked } } as unknown as MatSlideToggleChange);

    it('muestra el estado guardado', () => {
        const fixture = crear([fila(false)]);
        expect(fixture.componentInstance.carruselInicioVisible()).toBeFalse();
        expect(fixture.nativeElement.textContent).toContain('Mostrar el carrusel en el Inicio de la app');
    });

    it('sin la fila en el backend no muestra el interruptor', () => {
        const fixture = crear([]);
        expect(fixture.componentInstance.carruselInicioVisible()).toBeNull();
        expect(fixture.nativeElement.textContent).not.toContain('Mostrar el carrusel');
    });

    it('al cambiarlo manda solo visible', () => {
        const fixture = crear([fila(true)]);
        secciones.actualizar.and.returnValue(of(fila(false)));

        fixture.componentInstance.cambiarCarruselInicio(cambio(false));

        expect(secciones.actualizar).toHaveBeenCalledWith('carrusel-inicio', { visible: false });
        expect(fixture.componentInstance.carruselInicioVisible()).toBeFalse();
    });

    it('si el guardado falla, el interruptor vuelve a como estaba', () => {
        const fixture = crear([fila(true)]);
        secciones.actualizar.and.returnValue(throwError(() => new Error('500')));
        const evento = cambio(false);

        fixture.componentInstance.cambiarCarruselInicio(evento);

        expect(evento.source.checked).toBeTrue();
        expect(fixture.componentInstance.carruselInicioVisible()).toBeTrue();
        expect(fixture.componentInstance.guardandoCarrusel()).toBeFalse();
    });
});
