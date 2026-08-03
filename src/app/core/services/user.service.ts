import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { Observable, of, tap, map, catchError } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private usersSignal = signal<User[]>([]);
    private usersLoaded = false;

    constructor(
        private http: HttpClient,
        private config: ConfigService
    ) { }

    private get apiUrl(): string {
        return `${this.config.apiUrl}/api/users`;
    }

    get users() {
        return this.usersSignal.asReadonly();
    }

    // CREATE
    createUser(user: Omit<User, 'id'>): Observable<User> {
        const dto = this.mapUserToDto(user as User);
        return this.http.post<any>(`${this.config.apiUrl}/register`, dto).pipe(
            map(data => this.mapDtoToUser(data)),
            tap(created => {
                this.usersSignal.update((users: User[]) => [...users, created]);
            })
        );
    }

    // READ (All)
    getUsers(): Observable<User[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            map(dtos => dtos.map(dto => this.mapDtoToUser(dto))),
            tap(data => {
                this.usersSignal.set(data);
                this.usersLoaded = true;
            }),
            catchError(error => {
                console.error('Error fetching users from API', error);
                return of([]);
            })
        );
    }

    // UPDATE
    updateUser(id: string, changes: Partial<User>): Observable<User> {
        const dto = this.mapUserToDto(changes as User);
        return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
            map(data => this.mapDtoToUser(data)),
            tap(updatedUser => {
                this.usersSignal.update((users: User[]) => {
                    const index = users.findIndex(u => u.id === id);
                    if (index === -1) return users;
                    const updatedUsers = [...users];
                    updatedUsers[index] = updatedUser;
                    return updatedUsers;
                });
            })
        );
    }

    // DELETE
    deleteUser(id: string): Observable<boolean> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            map(() => true),
            tap(() => {
                this.usersSignal.update((users: User[]) => users.filter(u => u.id !== id));
            }),
            catchError(err => {
                console.error('Error deleting user', err);
                return of(false);
            })
        );
    }

    private mapDtoToUser(dto: any): User {
        return {
            id: dto.id,
            email: dto.email,
            firstName: dto.first_name,
            lastName: dto.last_name,
            birthDate: dto.birth_date,
            role: dto.role,
            phone: dto.phone,
            location: dto.location,
            bio: dto.bio,
            industry: dto.industry,
            profileImageUrl: dto.profile_image_url,
            companyName: dto.company_name,
            jobTitle: dto.job_title,
            country: dto.country,
            identificationType: dto.identification_type,
            identificationNumber: dto.identification_number,
            customerStatus: dto.customer_status,
            generation: dto.generation,
            isPublicProfile: dto.is_public_profile,
            allowMessagesFromStrangers: dto.allow_messages_from_strangers,
            showActivity: dto.show_activity,
            isActive: true // Default for now
        };
    }

    private mapUserToDto(user: User): any {
        return {
            email: user.email,
            password: user.password, // Only if provided
            first_name: user.firstName,
            last_name: user.lastName,
            birth_date: user.birthDate || null,
            role: user.role,
            phone: user.phone,
            location: user.location,
            bio: user.bio,
            industry: user.industry,
            profile_image_url: user.profileImageUrl,
            company_name: user.companyName,
            job_title: user.jobTitle,
            country: user.country,
            identification_type: user.identificationType,
            identification_number: user.identificationNumber,
            customer_status: user.customerStatus,
            generation: user.generation,
            is_public_profile: user.isPublicProfile,
            allow_messages_from_strangers: user.allowMessagesFromStrangers,
            show_activity: user.showActivity
        };
    }
}
