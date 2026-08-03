import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnChanges {
  @Input() events: Event[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto', // Allow it to expand naturally
    contentHeight: 'auto',
    expandRows: true,
    handleWindowResize: true,
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && this.events) {
      this.updateCalendarEvents();
    }
  }

  updateCalendarEvents() {
    const calendarEvents: any[] = [];

    this.events.forEach(event => {
      // Create a "master" event entry? Or just show workshops?
      // Requirement says "workshops consist of...". Usually checking schedule means checking workshops.

      event.workshops.forEach(workshop => {
        calendarEvents.push({
          title: `${workshop.name} - ${workshop.room}`,
          start: workshop.startDateTime,
          end: workshop.endDateTime,
          extendedProps: {
            speaker: workshop.speaker,
            eventTitle: event.title,
            imageUrl: workshop.imageUrl
          }
        });
      });
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: calendarEvents
    };
  }

  handleEventClick(arg: any) {
    const props = arg.event.extendedProps;
    alert(`Taller: ${arg.event.title}\nEvento: ${props.eventTitle}\nExpositor: ${props.speaker}`);
  }
}
