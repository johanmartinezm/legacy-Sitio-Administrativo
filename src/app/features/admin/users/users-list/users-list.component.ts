import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'email', 'identification', 'status', 'role', 'company', 'actions'];
    users = signal<User[]>([]);

    constructor(private userService: UserService, private dialog: MatDialog, private snackBar: MatSnackBar) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsers().subscribe(data => {
            this.users.set(data);
        });
    }

    openUserDialog(user?: User) {
        const dialogRef = this.dialog.open(UserFormDialogComponent, {
            width: '500px',
            data: user || null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (user) {
                    // Update
                    this.userService.updateUser(user.id, result).subscribe({
                        next: () => this.loadUsers(),
                        error: () => this.snackBar.open('No se pudo guardar el usuario. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 })
                    });
                } else {
                    // Create
                    this.userService.createUser(result).subscribe({
                        next: () => this.loadUsers(),
                        error: () => this.snackBar.open('No se pudo crear el usuario. Inténtalo de nuevo.', 'Cerrar', { duration: 5000 })
                    });
                }
            }
        });
    }

    deleteUser(user: User) {
        if (confirm(`¿Estás seguro de eliminar a ${user.firstName}?`)) {
            this.userService.deleteUser(user.id).subscribe(() => this.loadUsers());
        }
    }
}
