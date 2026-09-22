import { Component, ElementRef, ViewChild, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { VisitorService } from '../../services/visitor.service';
import { Host, VisitType } from '../../models/visitor.model';
import { PhotoCaptureComponent } from '../photo-capture/photo-capture.component';

@Component({
  selector: 'app-walk-in-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    PhotoCaptureComponent
  ],
  templateUrl: './walk-in-form.component.html',
  styleUrl: './walk-in-form.component.scss'
})
export class WalkInFormComponent {
  private fb = inject(FormBuilder);
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);
  photoDataUrl = signal<string>('');

  hosts = signal<Host[]>([]);
  selectedHostDepartment = signal('');

  visitTypes: VisitType[] = [
    'Business Guests', 'Vendor', 'Personnel', 'Govt Officials', 'Interview', 'Others'
  ];

  walkInForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.email]],
    phone: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    purpose: ['', Validators.required],
    hostId: ['', Validators.required],
    companyName: ['', Validators.required],
    visitType: ['Others' as VisitType]
  }, { validators: [this.atLeastOneContactValidator] });

  constructor() {
    // Load hosts
    this.visitorService.getHosts$().subscribe(hosts => {
      this.hosts.set(hosts);
    });
  }

  /** Custom validator: at least email or phone must be provided */
  atLeastOneContactValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.get('email')?.value;
    const phone = control.get('phone')?.value;
    if (!email && !phone) {
      return { atLeastOneContact: true };
    }
    return null;
  }

  onHostChange(hostId: string): void {
    const host = this.hosts().find(h => h.id === hostId);
    this.selectedHostDepartment.set(host?.department || '');
  }

  onPhotoCaptured(dataUrl: string): void {
    this.photoDataUrl.set(dataUrl);
  }

  onSubmit(): void {
    if (this.walkInForm.invalid) {
      this.walkInForm.markAllAsTouched();
      return;
    }

    if (!this.photoDataUrl()) {
      this.snackBar.open('Photo is required for walk-in registration', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const f = this.walkInForm.value;

    this.visitorService.addVisitor$({
      name: f.fullName,
      email: f.email || '',
      phone: f.phone || '',
      companyName: f.companyName,
      role: '',
      photoUrl: this.photoDataUrl(),
      visitType: f.visitType || 'Others',
      purpose: f.purpose,
      hostId: f.hostId,
      status: 'CHECKED_IN',
      registrationPath: 'walk-in',
      checkInTime: new Date(),
      checkOutTime: null,
      expectedStartTime: null,
      expectedEndTime: null,
      tempCardNo: `TC-${Math.floor(100 + Math.random() * 900)}`,
      additionalInfo: '',
      sponsorLOS: ''
    }).subscribe(() => {
      this.isSubmitting.set(false);
      this.snackBar.open('Walk-in visitor checked in successfully!', 'OK', { duration: 4000 });
      this.walkInForm.reset({ visitType: 'Others' });
      this.photoDataUrl.set('');
      this.selectedHostDepartment.set('');
    });
  }
}
