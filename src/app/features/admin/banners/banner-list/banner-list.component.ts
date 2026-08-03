import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Banner } from '../../../../core/models/banner.model';
import { BannerAdminService } from '../../../../core/services/banner_admin.service';
import { BannerFormDialogComponent } from '../banner-form-dialog/banner-form-dialog.component';

@Component({
    selector: 'app-banner-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './banner-list.component.html',
    styleUrls: ['./banner-list.component.scss']
})
export class BannerListComponent implements OnInit {
    banners = signal<Banner[]>([]);
    displayedColumns: string[] = ['image', 'title', 'category', 'order', 'status', 'actions'];

    constructor(
        private bannerService: BannerAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadBanners();
    }

    loadBanners(): void {
        this.bannerService.listAll().subscribe({
            next: (data) => this.banners.set(data),
            error: (err) => this.snackBar.open('Error al cargar banners', 'Cerrar', { duration: 3000 })
        });
    }

    openBannerDialog(banner?: Banner): void {
        const dialogRef = this.dialog.open(BannerFormDialogComponent, {
            width: '600px',
            data: banner ? { ...banner } : null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadBanners();
            }
        });
    }

    deleteBanner(banner: Banner): void {
        if (confirm(`¿Estás seguro de eliminar el banner "${banner.title}"?`)) {
            this.bannerService.delete(banner.id!).subscribe({
                next: () => {
                    this.snackBar.open('Banner eliminado', 'Cerrar', { duration: 3000 });
                    this.loadBanners();
                },
                error: () => this.snackBar.open('Error al eliminar banner', 'Cerrar', { duration: 3000 })
            });
        }
    }
}
