import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForumFlaggedPostsComponent } from './forum-flagged-posts.component';

describe('ForumFlaggedPostsComponent', () => {
  let component: ForumFlaggedPostsComponent;
  let fixture: ComponentFixture<ForumFlaggedPostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumFlaggedPostsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForumFlaggedPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
