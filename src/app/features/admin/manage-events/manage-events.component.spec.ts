import { ComponentFixture, TestBed } from '@angular/core/testing';
// Sin estos dos, el spec generado fallaba desde siempre: el componente inyecta
// EventService (que necesita HttpClient) y Router, y aqui no los daba nadie.
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ManageEventsComponent } from './manage-events.component';

describe('ManageEventsComponent', () => {
  let component: ManageEventsComponent;
  let fixture: ComponentFixture<ManageEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEventsComponent, HttpClientTestingModule, RouterModule.forRoot([]), NoopAnimationsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
