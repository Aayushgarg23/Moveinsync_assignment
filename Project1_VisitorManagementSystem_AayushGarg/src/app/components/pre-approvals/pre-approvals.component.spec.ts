import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreApprovalsComponent } from './pre-approvals.component';

describe('PreApprovalsComponent', () => {
  let component: PreApprovalsComponent;
  let fixture: ComponentFixture<PreApprovalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreApprovalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
