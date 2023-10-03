import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCsvDataComponent } from './add-csv-data.component';

describe('AddCsvDataComponent', () => {
  let component: AddCsvDataComponent;
  let fixture: ComponentFixture<AddCsvDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCsvDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCsvDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
