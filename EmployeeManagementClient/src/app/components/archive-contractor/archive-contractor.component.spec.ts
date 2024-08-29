import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchiveContractorComponent } from './archive-contractor.component';

describe('ArchiveContractorComponent', () => {
  let component: ArchiveContractorComponent;
  let fixture: ComponentFixture<ArchiveContractorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveContractorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArchiveContractorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
