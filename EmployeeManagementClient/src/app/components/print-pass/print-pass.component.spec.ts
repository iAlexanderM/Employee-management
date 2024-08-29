import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintPassComponent } from './print-pass.component';

describe('PrintPassComponent', () => {
  let component: PrintPassComponent;
  let fixture: ComponentFixture<PrintPassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintPassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
