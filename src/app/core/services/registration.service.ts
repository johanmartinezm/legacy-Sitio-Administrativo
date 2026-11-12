import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';
import { User } from '../models/user.model';
import { Event, Workshop } from '../models/event.model';
import { ConfigService } from './config.service';

export interface Registration {
    id: string;
    user: User;
    event: Event;
    workshops: Workshop[];
    paymentStatus: string;
    /** 'confirmed', 'pending_payment' o 'rejected'. */
    registrationStatus: string;
    registrationDate: Date;
    qrData: string;
}

@Injectable({
    providedIn: 'root'
})
export class RegistrationService {
    private registrationsSignal = signal<Registration[]>([]);

    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/events`;
    }

    /**
     * Un administrador inscribe a otra persona. El backend solo honra `userID` y
     * `paymentStatus` si quien llama es administrador. `free` y `paid` dejan la
     * inscripción confirmada y con QR; `pending` la deja pendiente de pago, para
     * aprobarla después desde «Inscritos».
     *
     * Si la persona ya estaba inscrita, el backend devuelve la inscripción que
     * había, con su estado, sin cambiarlo.
     */
    createRegistration(user: User, event: Event, workshops: Workshop[],
                       paymentStatus: 'free' | 'paid' | 'pending'): Observable<Registration> {
        const url = `${this.apiUrl}/${event.id}/register`;
        const body = {
            userID: user.id,
            paymentStatus,
            workshops: workshops.map(w => w.id)
        };

        return this.http.post<any>(url, body).pipe(
            map(res => ({
                id: res.id,
                user: user,
                event: event,
                workshops: workshops,
                paymentStatus: res.payment_status,
                registrationStatus: res.registration_status,
                registrationDate: new Date(res.registration_date),
                qrData: res.qr_data || ''
            })),
            tap(newRegistration => {
                this.registrationsSignal.update(regs => [...regs, newRegistration]);
            })
        );
    }
}
