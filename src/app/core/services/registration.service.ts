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
    paymentStatus: 'pending' | 'paid';
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

    createRegistration(user: User, event: Event, workshops: Workshop[]): Observable<Registration> {
        const url = `${this.apiUrl}/${event.id}/register`;
        const body = {
            userID: user.id,
            paymentStatus: 'paid', // Admin-initiated registrations are marked as paid
            workshops: workshops.map(w => w.id)
        };

        return this.http.post<any>(url, body).pipe(
            map(res => ({
                id: res.id,
                user: user,
                event: event,
                workshops: workshops,
                paymentStatus: res.payment_status as 'pending' | 'paid',
                registrationDate: new Date(res.registration_date),
                qrData: res.qr_data
            })),
            tap(newRegistration => {
                this.registrationsSignal.update(regs => [...regs, newRegistration]);
            })
        );
    }
}
