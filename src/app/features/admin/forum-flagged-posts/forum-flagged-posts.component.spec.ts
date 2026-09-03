import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ForumFlaggedPostsComponent } from './forum-flagged-posts.component';

/**
 * Prueba de humo de las publicaciones reportadas.
 *
 * Mismo caso que el listado de foros: pide los datos en `ngOnInit` por
 * `ForumAdminService` y le faltaba el `HttpClient`.
 */
describe('ForumFlaggedPostsComponent', () => {
    let component: ForumFlaggedPostsComponent;
    let fixture: ComponentFixture<ForumFlaggedPostsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ForumFlaggedPostsComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideNoopAnimations(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ForumFlaggedPostsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta su plantilla', () => {
        expect(component).toBeTruthy();
    });
});
