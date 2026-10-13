import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LegacyPlusItem, nombreGrupo } from '../../../../core/models/legacy-plus-item.model';
import { LegacyPlusItemAdminService } from '../../../../core/services/legacy_plus_item_admin.service';
import { ItemFormDialogComponent } from '../item-form-dialog/item-form-dialog.component';

/** «Puntos de Legacy+»: los puntos con check de la pantalla Legacy+ de la app. */
@Component({
    selector: 'app-legacy-plus-item-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './item-list.component.html',
    styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit {
    items = signal<LegacyPlusItem[]>([]);
    cargando = signal(true);
    displayedColumns = ['grupo', 'orden', 'punto', 'estado', 'acciones'];
    nombreGrupo = nombreGrupo;

    constructor(
        private itemService: LegacyPlusItemAdminService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.itemService.listAll().subscribe({
            next: (data) => {
                this.items.set(data);
                this.cargando.set(false);
            },
            error: () => {
                this.cargando.set(false);
                this.snackBar.open('No se pudieron cargar los puntos', 'Cerrar', { duration: 4000 });
            }
        });
    }

    abrir(item?: LegacyPlusItem): void {
        const dialogRef = this.dialog.open(ItemFormDialogComponent, {
            width: '640px',
            data: { item: item ? { ...item } : null, todos: this.items() }
        });
        dialogRef.afterClosed().subscribe(guardado => {
            if (guardado) {
                this.snackBar.open('Punto guardado', 'Cerrar', { duration: 3000 });
                this.cargar();
            }
        });
    }

    borrar(item: LegacyPlusItem): void {
        if (!confirm(`¿Eliminar el punto «${item.titulo}»? Si solo quiere ocultarlo, edítelo y desactívelo.`)) {
            return;
        }
        this.itemService.delete(item.id!).subscribe({
            next: () => {
                this.snackBar.open('Punto eliminado', 'Cerrar', { duration: 3000 });
                this.cargar();
            },
            error: () => this.snackBar.open('No se pudo eliminar el punto', 'Cerrar', { duration: 4000 })
        });
    }
}
