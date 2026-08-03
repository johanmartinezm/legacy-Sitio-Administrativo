import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-registration-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet],
    template: `
    <div class="registration-layout">
      <header class="page-header">
        <h1>Registro y Matrícula de Eventos</h1>
        <p>Gestiona la inscripción de usuarios y selección de workshops</p>
      </header>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
    styles: [`
    .registration-layout {
      padding: 24px;
      
      .page-header {
        margin-bottom: 24px;
        h1 { margin: 0; font-size: 24px; color: #333; }
        p { margin: 8px 0 0; color: #666; }
      }
    }
  `]
})
export class RegistrationLayoutComponent { }
