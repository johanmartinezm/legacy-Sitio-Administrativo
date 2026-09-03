import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

/**
 * AppComponent no hace nada más que montar el `<router-outlet>`: todo lo demás
 * lo pinta la ruta. Lo que estas pruebas comprueban es justamente eso, y que se
 * puede construir.
 *
 * **La tercera decía otra cosa y llevaba fallando desde el primer día.** Era la
 * que genera `ng new`: buscaba un `<h1>Hello, legacy-app</h1>` que solo existe
 * en la plantilla de ejemplo del CLI y que este proyecto borró en su primera
 * pantalla. Un test rojo permanente es peor que ninguno: acostumbra a mirar
 * `ng test` en rojo y a seguir adelante, y entonces deja de avisar de nada.
 */
describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            // El `<router-outlet>` de la plantilla necesita un router; sin él la
            // creación revienta antes de llegar a ninguna comprobación.
            providers: [provideRouter([])],
        }).compileComponents();
    });

    it('se construye', () => {
        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance).toBeTruthy();
    });

    it(`se llama 'legacy-app'`, () => {
        const fixture = TestBed.createComponent(AppComponent);
        expect(fixture.componentInstance.title).toEqual('legacy-app');
    });

    it('monta el router-outlet, que es todo lo que pinta', () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('router-outlet')).not.toBeNull();
    });
});
