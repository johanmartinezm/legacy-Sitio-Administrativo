import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminUser } from '../../../../core/models/admin-user.model';
import { AdminFormDialogComponent } from '../admin-form-dialog/admin-form-dialog.component';

@Component({
    selector: 'app-admin-list',
    standalone: true,
    imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
    templateUrl: './admin-list.component.html',
    styleUrls: ['./admin-list.component.scss']
})
export class AdminListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'email', 'role', 'actions'];
    admins = signal<AdminUser[]>([]);

    constructor(private adminService: AdminService, private dialog: MatDialog) { }

    ngOnInit(): void {
        this.loadAdmins();
    }

    loadAdmins() {
        this.adminService.listAdmins().subscribe(data => {
            this.admins.set(data);
        });
    }

    openAdminDialog(admin?: AdminUser) {
        const dialogRef = this.dialog.open(AdminFormDialogComponent, {
            width: '450px',
            data: admin || null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (admin && admin.id) {
                    this.adminService.updateAdmin(admin.id, result).subscribe(() => this.loadAdmins());
                } else {
                    this.adminService.registerAdmin(result).subscribe(() => this.loadAdmins());
                }
            }
        });
    }

    deleteAdmin(admin: AdminUser) {
        if (admin.id && confirm(`¿Estás seguro de eliminar al administrador ${admin.firstName}?`)) {
            this.adminService.deleteAdmin(admin.id).subscribe(() => this.loadAdmins());
        }
    }
}
