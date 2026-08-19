import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { EventService } from '../../../core/services/event.service';
import { BarcodeFormat } from '@zxing/library';

@Component({
    selector: 'app-attendance-scanner',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        ZXingScannerModule
    ],
    templateUrl: './attendance-scanner.component.html',
    styleUrls: ['./attendance-scanner.component.scss']
})
export class AttendanceScannerComponent {
    allowedFormats = [BarcodeFormat.QR_CODE];
    scannerEnabled = true;
    result: any = null;
    loading = false;
    showScanner = true;

    constructor(
        private eventService: EventService,
        private snackBar: MatSnackBar
    ) { }

    onCodeResult(resultString: string) {
        if (this.loading) return;

        this.loading = true;
        this.showScanner = false;
        this.scannerEnabled = false;

        this.eventService.checkIn(resultString).subscribe({
            next: (response) => {
                this.result = response;
                this.loading = false;
                // El backend marca alreadyCheckedIn cuando ese QR ya había
                // entrado: no registra una asistencia nueva, así que decir
                // "check-in exitoso" sería mentir sobre lo que acaba de pasar.
                const repetido = !!response?.alreadyCheckedIn;
                this.snackBar.open(
                    repetido ? 'Este código ya se había usado' : '¡Check-in exitoso!',
                    'Cerrar',
                    {
                        duration: repetido ? 5000 : 3000,
                        panelClass: [repetido ? 'error-snackbar' : 'success-snackbar']
                    });
            },
            error: (err) => {
                this.loading = false;
                this.showScanner = true;
                this.scannerEnabled = true;
                this.snackBar.open('Error: ' + (err.error || 'QR inválido'), 'Cerrar', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    resetScanner() {
        this.result = null;
        this.showScanner = true;
        this.scannerEnabled = true;
    }
}
