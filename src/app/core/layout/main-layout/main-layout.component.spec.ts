import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MainLayoutComponent } from './main-layout.component';

/**
 * Prueba de humo del armazón del panel: que se construye y que su plantilla se
 * pinta entera sin reventar.
 *
 * Suena a poco y no lo es: `detectChanges()` recorre la plantilla de verdad, así
 * que esto salta el día que alguien añada un servicio al constructor o una
 * directiva sin importar. Es exactamente el fallo que no se ve compilando,
 * porque un componente standalone que no declara lo que usa compila igual.
 *
 * Necesitaba dos cosas que no tenía y por eso llevaba fallando: el router —usa
 * `routerLink` y navega al salir— y las animaciones, que Material da por
 * supuestas (`NG05105: Unexpected synthetic listener @transform.start`).
 */
describe('MainLayoutComponent', () => {
    let component: MainLayoutComponent;
    let fixture: ComponentFixture<MainLayoutComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MainLayoutComponent],
            providers: [
                provideRouter([]),
                // Las de mentira: en una prueba no interesa esperar a que
                // termine ninguna transición, solo que el componente las declare.
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainLayoutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta su plantilla', () => {
        expect(component).toBeTruthy();
    });
});
