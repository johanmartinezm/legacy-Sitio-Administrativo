import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';
import { Observable, of, tap, map, catchError, switchMap } from 'rxjs';
import { ConfigService } from './config.service';
import { Pagina, LIMITE_MAXIMO_DE_PAGINA } from '../models/pagina';

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

    /**
     * Una página de cuentas, para la tabla.
     *
     * El total viene en la cabecera `X-Total-Count`, no en el cuerpo; por eso
     * hace falta `observe: 'response'`. Si la cabecera no llega —un backend
     * anterior al 2026-08-26— se cae al largo de la página, con lo que el
     * paginador muestra una sola: se ve poco, pero no se inventa nada.
     */
    getUsersPage(limit: number, offset: number): Observable<Pagina<User>> {
        return this.http.get<any[]>(this.apiUrl, {
            observe: 'response',
            params: { limit, offset }
        }).pipe(
            map(res => {
                const items = (res.body ?? []).map(dto => this.mapDtoToUser(dto));
                const cabecera = Number(res.headers.get('X-Total-Count'));
                return { items, total: Number.isFinite(cabecera) && cabecera > 0 ? cabecera : items.length };
            })
        );
    }

    /**
     * Todas las cuentas.
     *
     * **Sigue existiendo, y no por comodidad.** Lo usan tres pantallas que
     * necesitan la lista entera y no una página: el selector de miembros de un
     * grupo, el envío de notificaciones y el selector de inscripción. Si aquí se
     * devolviera solo la primera página, esas tres se quedarían callando a la
     * gente que no cupiera —un grupo al que le faltan miembros sin que nada lo
     * avise—.
     *
     * Lo que cambia es cómo se consigue: en vez de una consulta que se trae la
     * tabla entera, se recorren páginas del tamaño máximo que acepta el backend.
     * El coste por consulta queda acotado, que es lo que se buscaba.
     *
     * Si el día de mañana hay miles de cuentas, la respuesta no es subir el
     * techo sino que esas tres pantallas busquen contra el servidor en vez de
     * cargar todo en memoria.
     */
    getUsers(): Observable<User[]> {
        return this.recorrerPaginas(0, []).pipe(
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

    private recorrerPaginas(offset: number, acumulado: User[]): Observable<User[]> {
        return this.getUsersPage(LIMITE_MAXIMO_DE_PAGINA, offset).pipe(
            switchMap(pagina => {
                const todo = acumulado.concat(pagina.items);
                // Se para cuando ya se tienen todas **o cuando una página llega
                // vacía**. Lo segundo no es redundante: sin esa guarda, un total
                // mal calculado en el servidor dejaría el bucle pidiendo páginas
                // vacías para siempre.
                if (pagina.items.length === 0 || todo.length >= pagina.total) {
                    return of(todo);
                }
                return this.recorrerPaginas(offset + LIMITE_MAXIMO_DE_PAGINA, todo);
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
