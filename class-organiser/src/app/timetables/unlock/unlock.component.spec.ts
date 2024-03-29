import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnlockComponent } from './unlock.component';

describe('UnlockComponent', () => {
  let component: UnlockComponent;
  let fixture: ComponentFixture<UnlockComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UnlockComponent]
    });
    fixture = TestBed.createComponent(UnlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
