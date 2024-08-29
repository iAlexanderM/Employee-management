import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreFormComponent } from './store-form.component';

describe('StoreFormComponent', () => {
  let component: StoreFormComponent;
  let fixture: ComponentFixture<StoreFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
