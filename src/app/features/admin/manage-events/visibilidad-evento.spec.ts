import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ManageEventsComponent } from './manage-events.component';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models/event.model';

/**
 * Un evento oculto se listaba aqui exactamente igual que uno visible: la
 * columna `status` decide si sale en la app, y esta pantalla no la conocia. Con
 * lo cual, ademas, no habia forma de reactivarlo desde ningun sitio.
 *
 * Se renderiza la tabla de verdad —no se llama al metodo a mano— porque lo que
 * fallaba era justamente que la pantalla no mostraba nada.
 */
function evento(id: string, title: string, status: string): Event {
    return {
        id, title, status,
        description: '', imageUrl: '', category: '', categoryId: '',
        workshops: [], price: 0, isFree: true, buttonText: '',
        actionStatus: 'register', includes: ''
    } as Event;
}

describe('ManageEventsComponent · visibilidad en la app', () => {
    let fixture: ComponentFixture<ManageEventsComponent>;
    let component: ManageEventsComponent;
    let eventService: jasmine.SpyObj<EventService>;

    beforeEach(async () => {
        eventService = jasmine.createSpyObj('EventService', ['getEvents', 'updateStatus']);
        eventService.getEvents.and.returnValue(of([
            evento('1', 'Legacy Summit', 'active'),
            evento('2', 'Verificación interna', 'inactive')
        ]));
        eventService.updateStatus.and.returnValue(of({}));

        await TestBed.configureTestingModule({
            imports: [
                ManageEventsComponent,
                HttpClientTestingModule,
                NoopAnimationsModule,
                RouterModule.forRoot([])
            ],
            providers: [{ provide: EventService, useValue: eventService }]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageEventsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('distingue en la tabla el evento oculto del visible', () => {
        const texto: string = fixture.nativeElement.textContent;
        expect(texto).toContain('Visible');
        expect(texto).toContain('Oculto');

        const chips = fixture.nativeElement.querySelectorAll('.estado-chip');
        expect(chips.length).toBe(2);
        expect(chips[0].classList).not.toContain('estado-oculto');
        expect(chips[1].classList).toContain('estado-oculto');
    });

    it('reactiva el evento oculto', () => {
        spyOn(window, 'confirm').and.returnValue(true);

        component.toggleStatus(evento('2', 'Verificación interna', 'inactive'));

        expect(eventService.updateStatus).toHaveBeenCalledWith('2', 'active');
    });

    it('oculta el evento visible', () => {
        spyOn(window, 'confirm').and.returnValue(true);

        component.toggleStatus(evento('1', 'Legacy Summit', 'active'));

        expect(eventService.updateStatus).toHaveBeenCalledWith('1', 'inactive');
    });

    it('no cambia nada si se cancela la confirmacion', () => {
        spyOn(window, 'confirm').and.returnValue(false);

        component.toggleStatus(evento('1', 'Legacy Summit', 'active'));

        expect(eventService.updateStatus).not.toHaveBeenCalled();
    });

    it('recarga la lista despues de cambiar la visibilidad', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        eventService.getEvents.calls.reset();

        component.toggleStatus(evento('1', 'Legacy Summit', 'active'));

        expect(eventService.getEvents).toHaveBeenCalled();
    });

    // Sin el callback de error, un fallo dejaria la pantalla igual que estaba y
    // pareceria que el cambio se guardo. Es el mismo descuido que tenia el
    // guardado de usuarios hasta el 22-08.
    it('no se queda callado si el cambio falla', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        eventService.updateStatus.and.returnValue(throwError(() => new Error('500')));
        eventService.getEvents.calls.reset();

        expect(() => component.toggleStatus(evento('1', 'Legacy Summit', 'active'))).not.toThrow();
        expect(eventService.getEvents).not.toHaveBeenCalled();
    });
});
