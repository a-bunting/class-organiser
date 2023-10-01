import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildScheduleComponent } from './build-schedule.component';

describe('BuildScheduleComponent', () => {
  let component: BuildScheduleComponent;
  let fixture: ComponentFixture<BuildScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BuildScheduleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuildScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
