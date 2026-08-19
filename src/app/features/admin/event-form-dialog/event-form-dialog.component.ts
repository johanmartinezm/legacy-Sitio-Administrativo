import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Event, Workshop, Category } from '../../../core/models/event.model';
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
      workshops: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.sincronizarEnlaceConModalidad();
    if (this.data && this.data.event) {
      this.isEditMode = true;
      this.patchForm(this.data.event);
    } else {
      // Add one empty workshop by default for convenience
      this.addWorkshop();
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

  get workshops(): FormArray {
    return this.eventForm.get('workshops') as FormArray;
  }

  newWorkshop(): FormGroup {
    return this.fb.group({
      id: [Math.random().toString(36).substring(7)], // Temp ID
      name: ['', Validators.required],
      description: [''], // Added description
      room: ['', Validators.required],
      speaker: ['', Validators.required],
      imageUrl: [''], // Added Image URL
      startDateTime: [new Date(), Validators.required], // Simplified for demo
      startTime: ['09:00', Validators.required], // Helper control for time
      endDateTime: [new Date(), Validators.required],
      endTime: ['10:00', Validators.required]
    });
  }

  addWorkshop() {
    this.workshops.push(this.newWorkshop());
  }

  removeWorkshop(index: number) {
    this.workshops.removeAt(index);
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
      imageUrl: event.imageUrl,
      location: event.location,
      isVirtual: event.isVirtual ?? false,
      accessUrl: event.accessUrl ?? '',
      startDate: event.startDate,
      endDate: event.endDate,
      attendeesLimit: event.attendeesLimit,
      actionStatus: event.actionStatus,
      buttonText: event.buttonText,
      includes: event.includes || ''
    });

    // Clear existing workshops first
    while (this.workshops.length !== 0) {
      this.workshops.removeAt(0);
    }

    if (event.workshops && Array.isArray(event.workshops)) {
      event.workshops.forEach(workshop => {
        const workshopGroup = this.newWorkshop();

        // Extract time string from Date for the helper control
        const start = workshop.startDateTime ? new Date(workshop.startDateTime) : new Date();
        const end = workshop.endDateTime ? new Date(workshop.endDateTime) : new Date();

        const startTimeStr = !isNaN(start.getTime()) ? start.toTimeString().substring(0, 5) : '09:00';
        const endTimeStr = !isNaN(end.getTime()) ? end.toTimeString().substring(0, 5) : '10:00';

        workshopGroup.patchValue({
          id: workshop.id,
          name: workshop.name,
          description: workshop.description,
          room: workshop.room,
          speaker: workshop.speaker,
          imageUrl: workshop.imageUrl,
          startDateTime: !isNaN(start.getTime()) ? start : new Date(),
          startTime: startTimeStr,
          endDateTime: !isNaN(end.getTime()) ? end : new Date(),
          endTime: endTimeStr
        });
        this.workshops.push(workshopGroup);
      });
    }
  }

  onCategoryChange(categoryId: string) {
    const selected = this.categories.find(c => c.id === categoryId);
    if (selected) {
      this.eventForm.patchValue({ category: selected.name });
    }
  }

  combineDateAndTime(date: Date, time: string): Date {
    const d = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    d.setHours(hours);
    d.setMinutes(minutes);
    return d;
  }

  save() {
    if (this.eventForm.valid) {
      const formValue = this.eventForm.value;

      // Process workshops content to merge date + time
      const processedWorkshops: Workshop[] = formValue.workshops.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        room: w.room,
        speaker: w.speaker,
        imageUrl: w.imageUrl,
        startDateTime: this.combineDateAndTime(w.startDateTime, w.startTime),
        endDateTime: this.combineDateAndTime(w.endDateTime, w.endTime)
      }));

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
        isFree: formValue.price === 0,
        actionStatus: formValue.actionStatus || 'register',
        buttonText: formValue.buttonText || (formValue.price === 0 ? 'Registrarme Gratis' : 'Comprar Ticket'),
        includes: formValue.includes || '',
        workshops: processedWorkshops
      };

      this.dialogRef.close(eventData);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
