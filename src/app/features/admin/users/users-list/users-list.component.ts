import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatPaginatorModule],
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'email', 'identification', 'status', 'role', 'company', 'actions'];
    users = signal<User[]>([]);

    /**
     * La tabla pide una página al servidor, no la tabla entera.
     *
     * Antes se traía todo de una vez y **cada fila se descifra en el backend**,
     * así que el coste crecía con el número de cuentas, no con lo que se ve.
     */
    total = signal(0);
    tamanoDePagina = 50;
    paginaActual = 0;
    readonly tamanosDePagina = [25, 50, 100, 200];

    constructor(private userService: UserService, private dialog: MatDialog, private snackBar: MatSnackBar) { }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsersPage(this.tamanoDePagina, this.paginaActual * this.tamanoDePagina)
            .subscribe(pagina => {
                this.users.set(pagina.items);
                this.total.set(pagina.total);

                // Si se borra la última fila de la última página, esa página deja
                // de existir y la tabla se quedaría vacía con el paginador
                // diciendo que hay resultados. Se retrocede una y se vuelve a
                // pedir.
                if (pagina.items.length === 0 && this.paginaActual > 0) {
                    this.paginaActual--;
                    this.loadUsers();
                }
            });
    }

    cambiarPagina(evento: PageEvent) {
        this.paginaActual = evento.pageIndex;
        this.tamanoDePagina = evento.pageSize;
        this.loadUsers();
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
