import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ForumTreeComponent } from './forum-tree.component';

/**
 * Prueba de humo del árbol de un foro.
 *
 * Es el que más le faltaba: `HttpClient` por `ForumAdminService`, el router, y
 * sobre todo la **ruta activa**, porque lee el id del foro de la URL
 * (`route.snapshot.paramMap`). Se le da un id de mentira; lo que se comprueba no
 * es qué hace con él, sino que la pantalla se monta entera.
 */
describe('ForumTreeComponent', () => {
    let component: ForumTreeComponent;
    let fixture: ComponentFixture<ForumTreeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ForumTreeComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: { get: () => 'foro-de-prueba' } },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ForumTreeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta su plantilla', () => {
        expect(component).toBeTruthy();
    });
});
