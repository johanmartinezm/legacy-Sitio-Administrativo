import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Event, Category } from '../../../core/models/event.model';
import { EventService } from '../../../core/services/event.service';
import { ImageUploadComponent } from '../../../core/components/image-upload/image-upload.component';

@Component({
  selector: 'app-event-form-dialog',
  standalone: true,
  imports: [
        ImageUploadComponent,
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './event-form-dialog.component.html',
  styleUrls: ['./event-form-dialog.component.scss']
})
export class EventFormDialogComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  categories: Category[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EventFormDialogComponent>,
    private eventService: EventService,
    @Inject(MAT_DIALOG_DATA) public data: { event?: Event }
  ) {
    this.eventForm = this.fb.group({
      id: [null],
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      categoryId: ['', Validators.required],
      speaker: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      // Control propio, no derivado del precio. Hasta el 2026-09-04 se
      // guardaba `isFree: price === 0`, asi que un evento con precio no
      // podia estar gratuito: al reabrirlo y guardar volvia a ser de pago
      // sin avisar. Nace en `true` porque, mientras la pasarela de
      // CredibanCo siga bloqueada, todo evento nuevo tiene que ser
      // gratuito; el precio se guarda igual para cuando se reactive.
      isFree: [true],
      imageUrl: [''],
      location: [''],
      // Un evento virtual necesita enlace; uno presencial no. El validador se
      // pone y se quita al marcar la casilla, en ngOnInit.
      isVirtual: [false],
      accessUrl: [''],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      attendeesLimit: [null],
      actionStatus: ['register'],
      buttonText: ['Registrarme Agora'],
      includes: [''],
      model: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.sincronizarEnlaceConModalidad();
    if (this.data && this.data.event) {
      this.isEditMode = true;
      this.patchForm(this.data.event);
    }
  }

  /**
   * El enlace de acceso es obligatorio solo en los eventos virtuales. Sin esto
   * se podría guardar una masterclass virtual sin enlace, y quien se inscribiera
   * se quedaría sin QR (por virtual) y sin enlace (por vacío): sin nada.
   */
  private sincronizarEnlaceConModalidad(): void {
    const enlace = this.eventForm.get('accessUrl');
    const virtual = this.eventForm.get('isVirtual');
    if (!enlace || !virtual) return;

    const aplicar = (esVirtual: boolean) => {
      if (esVirtual) {
        enlace.addValidators(Validators.required);
      } else {
        enlace.removeValidators(Validators.required);
      }
      enlace.updateValueAndValidity({ emitEvent: false });
    };

    aplicar(virtual.value);
    virtual.valueChanges.subscribe(aplicar);
  }

  loadCategories() {
    this.eventService.getCategories().subscribe(categories => {
      this.categories = categories;
    });
  }

  patchForm(event: Event) {
    this.eventForm.patchValue({
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
      categoryId: event.categoryId,
      speaker: event.speaker,
      price: event.price,
      isFree: event.isFree ?? (event.price === 0),
      imageUrl: event.imageUrl,
      location: event.location,
      isVirtual: event.isVirtual ?? false,
      accessUrl: event.accessUrl ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      attendeesLimit: event.attendeesLimit,
      actionStatus: event.actionStatus,
      buttonText: event.buttonText,
      includes: event.includes || '',
      model: event.model || ''
    });
  }

  onCategoryChange(categoryId: string) {
    const selected = this.categories.find(c => c.id === categoryId);
    if (selected) {
      this.eventForm.patchValue({ category: selected.name });
    }
  }

  save() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;

      const eventData: Event = {
        id: formValue.id,
        title: formValue.title,
        description: formValue.description,
        category: formValue.category,
        categoryId: formValue.categoryId,
        speaker: formValue.speaker,
        price: formValue.price,
        imageUrl: formValue.imageUrl,
        location: formValue.location,
        isVirtual: !!formValue.isVirtual,
        // Un presencial no guarda enlace aunque haya quedado escrito al marcar
        // y desmarcar la casilla.
        accessUrl: formValue.isVirtual ? formValue.accessUrl : null,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        attendeesLimit: formValue.attendeesLimit,
        isFree: !!formValue.isFree,
        actionStatus: formValue.actionStatus || 'register',
        buttonText: formValue.buttonText || (formValue.isFree ? 'Registrarme Gratis' : 'Comprar Ticket'),
        includes: formValue.includes || '',
        model: formValue.model || '',
        // Los talleres no se editan aquí sino en su propia pantalla, y el PUT
        // del evento ya no los toca. Se conservan solo para que el modelo
        // siga completo.
        workshops: this.data?.event?.workshops ?? []
      };

      this.dialogRef.close(eventData);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
