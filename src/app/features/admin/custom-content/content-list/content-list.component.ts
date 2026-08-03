import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ContentAdminService, CustomContent } from '../../../../core/services/content_admin.service';
import { ContentFormDialogComponent } from '../content-form-dialog/content-form-dialog.component';

@Component({
    selector: 'app-content-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatChipsModule
    ],
    templateUrl: './content-list.component.html',
    styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
    contents = signal<CustomContent[]>([]);
    displayedColumns: string[] = ['type', 'title', 'category', 'status', 'actions'];

    constructor(
        private contentService: ContentAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadContent();
    }

    loadContent(): void {
        this.contentService.getContentItems().subscribe({
            next: (data) => this.contents.set(data),
            error: () => this.snackBar.open('Error al cargar contenido', 'Cerrar', { duration: 3000 })
        });
    }

    openContentDialog(content?: CustomContent): void {
        const dialogRef = this.dialog.open(ContentFormDialogComponent, {
            width: '800px',
            data: content ? { ...content } : null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadContent();
            }
        });
    }

    deleteContent(content: CustomContent): void {
        if (confirm(`¿Estás seguro de eliminar "${content.title}"?`)) {
            this.contentService.deleteContentItem(content.id!).subscribe({
                next: () => {
                    this.snackBar.open('Contenido eliminado', 'Cerrar', { duration: 3000 });
                    this.loadContent();
                },
                error: () => this.snackBar.open('Error al eliminar contenido', 'Cerrar', { duration: 3000 })
            });
        }
    }
}
