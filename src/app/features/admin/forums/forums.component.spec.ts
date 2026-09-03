import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ForumsComponent } from './forums.component';

/**
 * Prueba de humo del listado de foros.
 *
 * Le faltaba el HTTP: el componente pide los foros en `ngOnInit` a través de
 * `ForumAdminService`, y sin `HttpClient` la inyección falla antes de llegar a
 * comprobar nada. La petición se queda en la cola de pruebas sin responder, que
 * es lo que se quiere: aquí solo importa que la pantalla se monte.
 */
describe('ForumsComponent', () => {
    let component: ForumsComponent;
    let fixture: ComponentFixture<ForumsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ForumsComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ForumsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta su plantilla', () => {
        expect(component).toBeTruthy();
    });
});
