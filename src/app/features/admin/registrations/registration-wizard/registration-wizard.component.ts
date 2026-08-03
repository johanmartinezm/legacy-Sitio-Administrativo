import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

import { UserSelectorComponent } from '../components/user-selector/user-selector.component';
import { EventSelectorComponent } from '../components/event-selector/event-selector.component';
import { WorkshopListComponent } from '../components/workshop-list/workshop-list.component';
import { QrCodeComponent } from '../components/qr-code/qr-code.component';

import { RegistrationService, Registration } from '../../../../core/services/registration.service';
import { User } from '../../../../core/models/user.model';
import { Event, Workshop } from '../../../../core/models/event.model';
import { PaymentService } from '../../../../core/services/payment.service';

@Component({
    selector: 'app-registration-wizard',
    standalone: true,
    imports: [
        CommonModule,
        MatStepperModule,
        MatButtonModule,
        MatCardModule,
        FormsModule,
        ReactiveFormsModule,
        UserSelectorComponent,
        EventSelectorComponent,
        WorkshopListComponent,
        QrCodeComponent
    ],
    templateUrl: './registration-wizard.component.html',
    styleUrls: ['./registration-wizard.component.scss']
})
export class RegistrationWizardComponent {
    @ViewChild('stepper') stepper!: MatStepper;

    selectedUser: User | null = null;
    selectedEvent: Event | null = null;
    selectedWorkshops: Workshop[] = [];

    registration: Registration | null = null;
    isProcessing = false;

    constructor(
        private registrationService: RegistrationService,
        private paymentService: PaymentService
    ) { }

    onUserSelected(user: User) {
        this.selectedUser = user;
        // Auto-advance implies validation pass, but we let user click next
    }

    onEventSelected(event: Event) {
        this.selectedEvent = event;
        this.selectedWorkshops = []; // Reset workshops on event change
    }

    onWorkshopsChanged(workshops: Workshop[]) {
        this.selectedWorkshops = workshops;
    }

    get totalAmount(): number {
        return this.selectedEvent ? this.selectedEvent.price : 0;
    }

    processPayment() {
        if (!this.selectedUser || !this.selectedEvent) return;

        this.isProcessing = true;

        this.paymentService.createPaymentIntent({
            reference_type: 'EVENT',
            reference_id: this.selectedEvent.id,
            amount: this.totalAmount,
            // Assuming this app runs on localhost or prod domain, use current origin
            return_url: `${window.location.origin}/admin/payment-callback`
        }).subscribe({
            next: (res) => {
                // Redirect browser to CredibanCo Gateway
                window.location.href = res.form_url;
            },
            error: (err) => {
                this.isProcessing = false;
                console.error('Error creando intencion de pago', err);
                alert('No se pudo iniciar el proceso de pago. Intenta de nuevo.');
            }
        });
    }

    reset() {
        this.selectedUser = null;
        this.selectedEvent = null;
        this.selectedWorkshops = [];
        this.registration = null;
        this.stepper.reset();
    }
}
