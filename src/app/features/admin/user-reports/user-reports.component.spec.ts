import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { UserReportsComponent } from './user-reports.component';
import { UserReportService } from '../../../core/services/user-report.service';
import { UserReport } from '../../../core/models/user-report.model';

/**
 * Lo que se prueba aquí es que la bandeja abra por lo pendiente —que es lo que
 * hay que atender— y que un 403 se distinga de un fallo del servicio: el mensaje
 * genérico haría pensar que el backend está caído cuando lo que falta es el rol.
 */
describe('UserReportsComponent', () => {
  let component: UserReportsComponent;
  let fixture: ComponentFixture<UserReportsComponent>;
  let servicio: jasmine.SpyObj<UserReportService>;

  const reporte: UserReport = {
    id: 'rep-1',
    reporter_id: 'u-1',
    reported_id: 'u-2',
    reporter_name: 'Ana Pérez',
    reported_name: 'Beto Ruiz',
    message_id: null,
    reason: 'Mensajes ofensivos',
    status: 'pending',
    created_at: '2026-08-10T12:00:00Z',
  };

  beforeEach(async () => {
    servicio = jasmine.createSpyObj('UserReportService', [
      'getReports',
      'resolveReport',
    ]);
    servicio.getReports.and.returnValue(of([reporte]));
    servicio.resolveReport.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [UserReportsComponent],
      providers: [{ provide: UserReportService, useValue: servicio }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('abre filtrando por pendientes', () => {
    expect(component.filtro).toBe('pending');
    expect(servicio.getReports).toHaveBeenCalledWith('pending');
    expect(component.reports.length).toBe(1);
  });

  it('el filtro "Todos" no manda estado al backend', () => {
    component.cambiarFiltro('all');
    expect(servicio.getReports).toHaveBeenCalledWith(undefined);
  });

  it('distingue el 403 de un fallo del servicio', () => {
    servicio.getReports.and.returnValue(throwError(() => ({ status: 403 })));
    component.cargar();
    expect(component.error).toBe('Esta información es solo para administradores');

    servicio.getReports.and.returnValue(throwError(() => ({ status: 500 })));
    component.cargar();
    expect(component.error).toBe('No se pudieron cargar los reportes');
  });

  it('resolver pide confirmación antes de cambiar el estado', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.resolver(reporte, 'reviewed');
    expect(servicio.resolveReport).not.toHaveBeenCalled();

    (window.confirm as jasmine.Spy).and.returnValue(true);
    component.resolver(reporte, 'reviewed');
    expect(servicio.resolveReport).toHaveBeenCalledWith('rep-1', 'reviewed');
  });

  it('el texto de lista vacía depende del filtro', () => {
    component.filtro = 'pending';
    expect(component.textoVacio).toBe('No hay reportes pendientes');
    component.filtro = 'dismissed';
    expect(component.textoVacio).toBe('No hay reportes con este estado');
  });
});
