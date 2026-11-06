import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Workshop } from '../../../core/models/event.model';
import { ImageUploadComponent } from '../../../core/components/image-upload/image-upload.component';

export interface DatosDelTaller {
  /** Sin taller es crear uno nuevo. */
  workshop?: Workshop;
  /**
   * Primer y último día del evento. El inicio se propone como fecha del taller
   * nuevo, y los dos acotan los calendarios: el backend rechaza un workshop
   * fuera de las fechas del evento. Sin fin, el evento es de un solo día.
   */
  inicioDelEvento?: Date;
  finDelEvento?: Date;
}

/**
 * Crear o editar un taller. Devuelve el taller al cerrar y no lo guarda: de eso
 * se encarga la pantalla de talleres, que sabe si es alta o edición.
 *
 * Hasta el 2026-10-28 estos campos vivían dentro del formulario del evento.
 */
@Component({
  selector: 'app-workshop-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    ImageUploadComponent
  ],
  templateUrl: './workshop-form-dialog.component.html',
  styleUrls: ['./workshop-form-dialog.component.scss']
})
export class WorkshopFormDialogComponent {
  form: FormGroup;
  isEditMode: boolean;
  /** Límites de los calendarios: el primer y el último día del evento. */
  minFecha: Date | null;
  maxFecha: Date | null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WorkshopFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DatosDelTaller
  ) {
    const taller = data?.workshop;
    this.isEditMode = !!taller;

    this.minFecha = this.fechaValida(data?.inicioDelEvento);
    this.maxFecha = this.fechaValida(data?.finDelEvento) ?? this.minFecha;

    const dia = this.minFecha ? new Date(this.minFecha) : new Date();
    const inicio = this.fechaValida(taller?.startDateTime) ?? dia;
    const fin = this.fechaValida(taller?.endDateTime) ?? dia;

    this.form = this.fb.group({
      name: [taller?.name ?? '', Validators.required],
      description: [taller?.description ?? ''],
      room: [taller?.room ?? '', Validators.required],
      speaker: [taller?.speaker ?? '', Validators.required],
      imageUrl: [taller?.imageUrl ?? ''],
      startDate: [inicio, Validators.required],
      startTime: [taller ? this.hora(inicio) : '09:00', Validators.required],
      endDate: [fin, Validators.required],
      endTime: [taller ? this.hora(fin) : '10:00', Validators.required]
    }, {
      validators: [
        (g: AbstractControl) => this.finDespuesDelInicio(g),
        (g: AbstractControl) => this.dentroDelEvento(g)
      ]
    });
  }

  /**
   * El backend rechaza un workshop fuera de las fechas del evento: uno de antes
   * habilitaba la calificación y el material en la app antes de que el evento
   * empezara. Se compara por día, como las fechas del evento.
   */
  private dentroDelEvento(g: AbstractControl): ValidationErrors | null {
    const v = g.value;
    if (!this.minFecha || !v.startDate || !v.endDate) return null;
    const dia = (d: Date) => {
      const x = new Date(d);
      return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    };
    const fuera = dia(v.startDate) < dia(this.minFecha) || dia(v.endDate) > dia(this.maxFecha!);
    return fuera ? { fueraDelEvento: true } : null;
  }

  /** «del 18/11/2026 al 20/11/2026», o «el 18/11/2026» si es de un día. */
  get fechasDelEvento(): string {
    if (!this.minFecha) return '';
    const f = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const desde = f(this.minFecha);
    const hasta = f(this.maxFecha!);
    return desde === hasta ? `el ${desde}` : `del ${desde} al ${hasta}`;
  }

  /**
   * El backend rechaza un fin anterior al inicio; mejor que se vea aquí, junto
   * a los campos, que como un error al guardar.
   */
  private finDespuesDelInicio(g: AbstractControl): ValidationErrors | null {
    const v = g.value;
    if (!v.startDate || !v.endDate || !v.startTime || !v.endTime) return null;
    const inicio = this.combinar(v.startDate, v.startTime);
    const fin = this.combinar(v.endDate, v.endTime);
    return fin < inicio ? { finAntesDelInicio: true } : null;
  }

  private fechaValida(fecha?: Date): Date | null {
    if (!fecha) return null;
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? null : d;
  }

  private hora(d: Date): string {
    return d.toTimeString().substring(0, 5);
  }

  private combinar(fecha: Date, hora: string): Date {
    const d = new Date(fecha);
    const [horas, minutos] = hora.split(':').map(Number);
    d.setHours(horas, minutos, 0, 0);
    return d;
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const taller: Workshop = {
      id: this.data?.workshop?.id ?? '',
      name: v.name.trim(),
      description: v.description || '',
      room: v.room,
      speaker: v.speaker,
      imageUrl: v.imageUrl || '',
      startDateTime: this.combinar(v.startDate, v.startTime),
      endDateTime: this.combinar(v.endDate, v.endTime)
    };
    this.dialogRef.close(taller);
  }

  close() {
    this.dialogRef.close();
  }
}
