import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildTimetableComponent } from './build-timetable.component';

describe('BuildTimetableComponent', () => {
  let component: BuildTimetableComponent;
  let fixture: ComponentFixture<BuildTimetableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildTimetableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
