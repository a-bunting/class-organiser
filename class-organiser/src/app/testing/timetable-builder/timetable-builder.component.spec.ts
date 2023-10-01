import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetableBuilderComponent } from './timetable-builder.component';

describe('TimetableBuilderComponent', () => {
  let component: TimetableBuilderComponent;
  let fixture: ComponentFixture<TimetableBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimetableBuilderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimetableBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
