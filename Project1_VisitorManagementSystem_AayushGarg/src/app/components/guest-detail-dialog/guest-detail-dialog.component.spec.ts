import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestDetailDialogComponent } from './guest-detail-dialog.component';

describe('GuestDetailDialogComponent', () => {
  let component: GuestDetailDialogComponent;
  let fixture: ComponentFixture<GuestDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
