import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { LoginComponent } from './login.component';

/**
 * Prueba de humo de la pantalla de entrada al panel.
 *
 * Ya traía el HTTP y el router simulados; lo que le faltaba eran las
 * animaciones. Los campos de Material las usan para el mensaje de error
 * (`@transitionMessages`), así que sin ellas la plantilla revienta al pintarse
 * con `NG05105` — un fallo que no dice «te falta esto» a primera vista y que
 * llevaba aquí desde que se generó el archivo.
 */
describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta su formulario', () => {
        expect(component).toBeTruthy();
    });
});
