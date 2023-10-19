import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCollectionComponent } from './data-collection.component';

describe('DataCollectionComponent', () => {
  let component: DataCollectionComponent;
  let fixture: ComponentFixture<DataCollectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DataCollectionComponent]
    });
    fixture = TestBed.createComponent(DataCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
