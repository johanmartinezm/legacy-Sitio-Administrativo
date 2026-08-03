import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
    selector: 'app-qr-code',
    standalone: true,
    imports: [CommonModule, QRCodeModule],
    template: `
    <div class="qr-container" *ngIf="qrData">
      <h3>Tu Código de Acceso</h3>
      <qrcode [qrdata]="qrData" [width]="256" [errorCorrectionLevel]="'M'"></qrcode>
      <p class="qr-hint">Escanea este código al ingresar al evento.</p>
    </div>
  `,
    styles: [`
    .qr-container { 
        text-align: center; 
        padding: 20px; 
        background: white; 
        border-radius: 8px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: inline-block;
    }
    .qr-hint { margin-top: 10px; color: #666; font-size: 0.9em; }
  `]
})
export class QrCodeComponent {
    @Input() qrData: string = '';
}
