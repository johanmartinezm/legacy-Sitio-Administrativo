import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumTreeComponent } from './forum-tree.component';

describe('ForumTreeComponent', () => {
  let component: ForumTreeComponent;
  let fixture: ComponentFixture<ForumTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumTreeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForumTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
