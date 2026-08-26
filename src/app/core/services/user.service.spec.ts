import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { User } from '../models/user.model';

describe('UserService', () => {
    let service: UserService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [UserService]
        });
        service = TestBed.inject(UserService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should map DTO with birth_date and generation to User model', () => {
        const mockDto = {
            id: '1',
            email: 'test@example.com',
            first_name: 'Juan',
            last_name: 'Perez',
            birth_date: '1990-01-01T00:00:00Z',
            generation: 'Segunda',
            is_public_profile: true,
            allow_messages_from_strangers: false,
            show_activity: true,
            role: 'profesional'
        };

        service.getUsers().subscribe(users => {
            const user = users[0];
            expect(user.firstName).toBe('Juan');
            expect(user.birthDate).toBe('1990-01-01T00:00:00Z');
            expect(user.generation).toBe('Segunda');
            expect(user.isPublicProfile).toBe(true);
            expect(user.allowMessagesFromStrangers).toBe(false);
            expect(user.showActivity).toBe(true);
        });

        // getUsers() recorre paginas desde el 2026-08-26, asi que la peticion
        // lleva limit y offset. Se compara por URL sin la query.
        const req = httpMock.expectOne(r => r.url === 'http://localhost:8080/api/users');
        req.flush([mockDto]);
    });

    it('should send correctly mapped DTO when updating user', () => {
        const changes: Partial<User> = {
            firstName: 'Juan Modificado',
            isPublicProfile: false,
            birthDate: '1991-05-05'
        };

        service.updateUser('1', changes).subscribe();

        const req = httpMock.expectOne('http://localhost:8080/api/users/1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body.first_name).toBe('Juan Modificado');
        expect(req.request.body.is_public_profile).toBe(false);
        expect(req.request.body.birth_date).toBe('1991-05-05');

        req.flush({ ...changes, id: '1' });
    });
});
