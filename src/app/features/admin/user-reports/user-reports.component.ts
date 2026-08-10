import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserReportService } from '../../../core/services/user-report.service';
import {
  UserReport,
  UserReportStatus,
  USER_REPORT_STATUS_LABELS,
} from '../../../core/models/user-report.model';

/**
 * Bandeja de reportes de personas hechos desde la app.
 *
 * La directriz 1.2 de Apple exige poder reportar y bloquear desde la app; esta
 * pantalla es lo que hace que esos reportes sirvan para algo. Sin ella se
 * recogen denuncias que nadie lee.
 *
 * Es pantalla y no diálogo, como la de inscritos: la lista puede crecer, se
 * recorre buscando un caso concreto y conviene poder dejarla abierta.
 */
@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.scss'],
})
export class UserReportsComponent implements OnInit {
  reports: UserReport[] = [];
  loading = true;
  error: string | null = null;

  /** Arranca en "pendiente": es lo que hay que atender. */
  filtro: UserReportStatus | 'all' = 'pending';

  readonly etiquetas = USER_REPORT_STATUS_LABELS;

  constructor(private service: UserReportService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = null;

    const status = this.filtro === 'all' ? undefined : this.filtro;
    this.service.getReports(status).subscribe({
      next: (data) => {
        this.reports = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        // El 403 lleva su propio mensaje, como en el resto de pantallas de
        // administración: el genérico haría pensar que el servicio está caído.
        this.error =
          err?.status === 403
            ? 'Esta información es solo para administradores'
            : 'No se pudieron cargar los reportes';
        this.loading = false;
      },
    });
  }

  cambiarFiltro(filtro: UserReportStatus | 'all'): void {
    this.filtro = filtro;
    this.cargar();
  }

  /**
   * Marcar como revisado o descartado.
   *
   * Ninguna de las dos acciones bloquea ni elimina a nadie: solo dice qué se ha
   * hecho con la denuncia. Las medidas sobre la cuenta se toman desde
   * "Administrar Usuarios".
   */
  resolver(report: UserReport, status: UserReportStatus): void {
    const verbo = status === 'reviewed' ? 'revisado' : 'descartado';
    if (!confirm(`¿Marcar como ${verbo} el reporte sobre ${report.reported_name}?`)) {
      return;
    }

    this.service.resolveReport(report.id, status).subscribe({
      next: () => this.cargar(),
      error: () => {
        this.error = 'No se pudo actualizar el reporte';
      },
    });
  }

  get hayReportes(): boolean {
    return this.reports.length > 0;
  }

  get textoVacio(): string {
    return this.filtro === 'pending'
      ? 'No hay reportes pendientes'
      : 'No hay reportes con este estado';
  }
}
