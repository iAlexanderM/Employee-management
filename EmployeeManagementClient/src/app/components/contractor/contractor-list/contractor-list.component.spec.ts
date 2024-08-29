import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorListComponent } from './contractor-list.component';

describe('ContractorListComponent', () => {
  let component: ContractorListComponent;
  let fixture: ComponentFixture<ContractorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractorListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
