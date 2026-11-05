import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialWorkshopDialogComponent, enlaceDeVideoValido } from './material-workshop-dialog.component';
import { ConfigService } from '../../../core/services/config.service';
import { Workshop } from '../../../core/models/event.model';

class ConfigServiceFalso {
  get apiUrl(): string {
    return 'http://api-de-prueba';
  }
}

const workshop = (extra: Partial<Workshop> = {}): Workshop => ({
  id: 'ws-1',
  name: 'Protocolo',
  room: 'Sala 1',
  speaker: 'Ana Ruiz',
  startDateTime: new Date('2026-12-10T09:00:00-05:00'),
  endDateTime: new Date('2026-12-10T10:30:00-05:00'),
  ...extra,
});

/** Parte A del plan de workshops: el material de cada workshop. */
describe('MaterialWorkshopDialogComponent', () => {
  describe('enlace del video', () => {
    const valida = (v: string) => enlaceDeVideoValido(new FormControl(v));

    it('acepta YouTube y Vimeo que apuntan a un video', () => {
      for (const v of [
        '',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://www.youtube.com/shorts/abc',
        'https://vimeo.com/123456789/abc123',
        'https://player.vimeo.com/video/123456789?h=abc',
      ]) {
        expect(valida(v)).withContext(v).toBeNull();
      }
    });

    it('rechaza lo demás con el mismo motivo que el servidor', () => {
      expect(valida('http://youtu.be/x')?.['video']).toContain('https://');
      expect(valida('https://www.dailymotion.com/video/x')?.['video']).toContain('YouTube o de Vimeo');
      expect(valida('https://www.youtube.com/')?.['video']).toContain('no apunta a un video');
      expect(valida('https://vimeo.com/canal/algo')?.['video']).toContain('no apunta a un video');
    });
  });

  describe('diálogo', () => {
    let fixture: ComponentFixture<MaterialWorkshopDialogComponent>;
    let component: MaterialWorkshopDialogComponent;
    let http: HttpTestingController;
    let cerrado: any;

    function montar(w: Workshop) {
      cerrado = undefined;
      TestBed.configureTestingModule({
        imports: [MaterialWorkshopDialogComponent, HttpClientTestingModule, NoopAnimationsModule],
        providers: [
          { provide: ConfigService, useClass: ConfigServiceFalso },
          { provide: MAT_DIALOG_DATA, useValue: w },
          { provide: MatDialogRef, useValue: { close: (v: any) => (cerrado = v) } },
        ],
      });
      fixture = TestBed.createComponent(MaterialWorkshopDialogComponent);
      component = fixture.componentInstance;
      http = TestBed.inject(HttpTestingController);
      fixture.detectChanges();
    }

    afterEach(() => http.verify());

    it('arranca con el material que ya tiene', () => {
      montar(workshop({
        material: {
          imageUrl: 'http://api/img.jpg', fileName: 'uuid_Guia.pdf', fileOriginalName: 'Guía.pdf',
          fileSize: 2048, videoUrl: 'https://youtu.be/x',
        },
      }));
      expect(component.archivo?.fileOriginalName).toBe('Guía.pdf');
      expect(component.urlDelArchivo()).toBe('http://api-de-prueba/api/documents/uuid_Guia.pdf');
      expect(fixture.nativeElement.textContent).toContain('Guía.pdf');
    });

    it('rechaza antes de subir lo que el servidor no admite', () => {
      montar(workshop());
      expect(component.validarArchivo(new File(['x'], 'foto.png'))).toContain('PDF, Word');
      const grande = { name: 'libro.pdf', size: 26 * 1024 * 1024 } as File;
      expect(component.validarArchivo(grande)).toContain('25 MB');
      expect(component.validarArchivo(new File(['x'], 'Agenda.PDF'))).toBeNull();
    });

    it('sube el archivo y guarda los tres campos', () => {
      montar(workshop());
      const input = { files: [new File(['%PDF'], 'Guía.pdf')], value: 'x' } as unknown as HTMLInputElement;
      component.elegirArchivo({ target: input } as unknown as Event);

      http.expectOne('http://api-de-prueba/api/documents/upload')
        .flush({ name: 'uuid_Gu-a.pdf', originalName: 'Guía.pdf', size: 4 });

      component.form.patchValue({ videoUrl: ' https://vimeo.com/123/abc ' });
      expect(component.esVimeo).toBeTrue();
      component.guardar();

      expect(cerrado).toEqual({
        imageUrl: '', videoUrl: 'https://vimeo.com/123/abc',
        fileName: 'uuid_Gu-a.pdf', fileOriginalName: 'Guía.pdf', fileSize: 4,
      });
    });

    it('muestra el motivo si el servidor rechaza el archivo', () => {
      montar(workshop());
      const input = { files: [new File(['MZ'], 'falso.pdf')], value: 'x' } as unknown as HTMLInputElement;
      component.elegirArchivo({ target: input } as unknown as Event);
      http.expectOne('http://api-de-prueba/api/documents/upload')
        .flush('el archivo no es lo que dice su extensión\n', { status: 400, statusText: 'Bad Request' });

      expect(component.errorArchivo).toBe('El archivo no es lo que dice su extensión');
      expect(component.archivo).toBeNull();
    });

    it('con un video inválido no deja guardar', () => {
      montar(workshop());
      component.form.patchValue({ videoUrl: 'https://example.com/video' });
      component.guardar();
      expect(cerrado).toBeUndefined();
    });

    it('quitar el archivo lo deja vacío al guardar', () => {
      montar(workshop({
        material: { imageUrl: '', fileName: 'uuid_a.pdf', fileOriginalName: 'a.pdf', fileSize: 9, videoUrl: '' },
      }));
      component.quitarArchivo();
      component.guardar();
      expect(cerrado.fileName).toBe('');
      expect(cerrado.fileSize).toBe(0);
    });
  });
});
