import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimetableSettingsComponent } from './timetable-settings.component';

describe('TimetableSettingsComponent', () => {
  let component: TimetableSettingsComponent;
  let fixture: ComponentFixture<TimetableSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimetableSettingsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimetableSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
