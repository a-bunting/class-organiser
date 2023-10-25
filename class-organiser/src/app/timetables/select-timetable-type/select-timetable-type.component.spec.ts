import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTimetableTypeComponent } from './select-timetable-type.component';

describe('SelectTimetableTypeComponent', () => {
  let component: SelectTimetableTypeComponent;
  let fixture: ComponentFixture<SelectTimetableTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SelectTimetableTypeComponent]
    });
    fixture = TestBed.createComponent(SelectTimetableTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
