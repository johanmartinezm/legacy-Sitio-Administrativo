import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { EventFormDialogComponent } from './event-form-dialog.component';

/**
 * Prueba de humo del formulario de crear y editar eventos.
 *
 * Le faltaban el HTTP —el componente pide las categorías por `EventService`— y
 * las animaciones de Material. El diálogo ya venía simulado.
 *
 * Se abre **sin evento** (`MAT_DIALOG_DATA` vacío), que es el caso de crear uno
 * nuevo: es el que recorre más plantilla, porque no hay nada precargado que
 * pueda tapar un control mal declarado.
 */
describe('EventFormDialogComponent', () => {
    let component: EventFormDialogComponent;
    let fixture: ComponentFixture<EventFormDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EventFormDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: { close: () => { } } },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                provideHttpClient(),
                // Las peticiones que lance al arrancar se quedan en la cola de
                // pruebas y nadie las responde: aquí solo interesa que la
                // pantalla se monte, no qué devuelve el servidor.
                provideHttpClientTesting(),
                provideNoopAnimations(),
                // El formulario lleva un selector de fecha, y Material exige un
                // adaptador de fechas explícito. Se usa el mismo que la app
                // (`app.config.ts`): si el día de mañana se cambia allí por otro,
                // que esta prueba refleje lo que corre de verdad.
                provideNativeDateAdapter(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EventFormDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('se construye y pinta el formulario de un evento nuevo', () => {
        expect(component).toBeTruthy();
    });
});
