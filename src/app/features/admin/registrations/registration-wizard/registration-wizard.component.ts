import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { UserSelectorComponent } from '../components/user-selector/user-selector.component';
import { EventSelectorComponent } from '../components/event-selector/event-selector.component';
import { WorkshopListComponent } from '../components/workshop-list/workshop-list.component';
import { QrCodeComponent } from '../components/qr-code/qr-code.component';

import { RegistrationService, Registration } from '../../../../core/services/registration.service';
import { User } from '../../../../core/models/user.model';
import { Event, Workshop } from '../../../../core/models/event.model';

/**
 * Un administrador inscribe a otra persona en un evento.
 *
 * No pasa por la pasarela: antes este asistente abría una intención de pago en
 * CredibanCo a nombre del propio administrador (el backend toma el usuario del
 * token) y nunca creaba la inscripción. Ahora llama directamente a
 * POST /api/events/{id}/register con `userID`, que el backend solo acepta de un
 * administrador. En un evento de pago, quien inscribe dice si la persona ya
 * pagó por fuera (queda confirmada, con QR) o si queda pendiente, para
 * aprobarla después desde «Inscritos».
 */
@Component({
    selector: 'app-registration-wizard',
    standalone: true,
    imports: [
        CommonModule,
        MatStepperModule,
        MatButtonModule,
        MatCardModule,
        MatRadioModule,
        MatSnackBarModule,
        FormsModule,
        UserSelectorComponent,
        EventSelectorComponent,
        WorkshopListComponent,
        QrCodeComponent
    ],
    templateUrl: './registration-wizard.component.html',
    styleUrls: ['./registration-wizard.component.scss']
})
export class RegistrationWizardComponent {
    @ViewChild('stepper') stepper?: MatStepper;

    selectedUser: User | null = null;
    selectedEvent: Event | null = null;
    selectedWorkshops: Workshop[] = [];
    /** Solo en eventos de pago. Sin valor hasta que el administrador elige. */
    estadoDePago: 'paid' | 'pending' | null = null;

    registration: Registration | null = null;
    isProcessing = false;

    /**
     * Al cambiar, se destruye y se vuelve a crear todo el asistente (ver el
     * `@for` de la plantilla). Es la forma de que «Nuevo registro» deje vacíos
     * también el buscador, el selector y las casillas, que guardan su propio
     * estado.
     */
    ciclo = 0;

    constructor(
        private registrationService: RegistrationService,
        private snackBar: MatSnackBar
    ) { }

    onUserSelected(user: User) {
        this.selectedUser = user;
    }

    onEventSelected(event: Event) {
        this.selectedEvent = event;
        this.selectedWorkshops = [];
        this.estadoDePago = null;
    }

    onWorkshopsChanged(workshops: Workshop[]) {
        this.selectedWorkshops = workshops;
    }

    get esDePago(): boolean {
        return !!this.selectedEvent && !this.selectedEvent.isFree;
    }

    get puedeAvanzarDelEvento(): boolean {
        return !!this.selectedEvent && (!this.esDePago || this.estadoDePago !== null);
    }

    get totalAmount(): number {
        return this.esDePago ? this.selectedEvent!.price : 0;
    }

    get confirmada(): boolean {
        return this.registration?.registrationStatus === 'confirmed';
    }

    inscribir() {
        if (!this.selectedUser || !this.selectedEvent || !this.puedeAvanzarDelEvento) return;

        const paymentStatus = this.esDePago ? this.estadoDePago! : 'free';
        this.isProcessing = true;

        this.registrationService.createRegistration(
            this.selectedUser, this.selectedEvent, this.selectedWorkshops, paymentStatus
        ).subscribe({
            next: (reg) => {
                this.isProcessing = false;
                this.registration = reg;
                this.stepper?.next();
            },
            error: (err) => {
                this.isProcessing = false;
                // El backend responde el motivo en texto plano y en español
                // (cupo lleno, workshop inválido…): se muestra tal cual.
                const detalle = typeof err?.error === 'string' && err.error.trim()
                    ? err.error.trim()
                    : 'No se pudo inscribir. Intenta de nuevo.';
                this.snackBar.open(detalle, 'Cerrar', { duration: 6000 });
            }
        });
    }

    reset() {
        this.selectedUser = null;
        this.selectedEvent = null;
        this.selectedWorkshops = [];
        this.estadoDePago = null;
        this.registration = null;
        this.ciclo++;
    }
}
