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
import { RouterModule, Router } from '@angular/router';
import { VisitorService } from '../../services/visitor.service';
import { Host, VisitType } from '../../models/visitor.model';
import { PhotoCaptureComponent } from '../photo-capture/photo-capture.component';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
import { catchError } from 'rxjs';

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
    PhotoCaptureComponent,
    RouterModule
  ],
  templateUrl: './walk-in-form.component.html',
  styleUrl: './walk-in-form.component.scss'
})
export class WalkInFormComponent {
  private fb = inject(FormBuilder);
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private errorService = inject(ErrorSnackbarService);

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
    this.visitorService.getHosts$().subscribe(hosts => {
      this.hosts.set(hosts);
    });
  }

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
    const formValue = this.walkInForm.value;

    this.visitorService.addVisitor$({
      name: formValue.fullName,
      email: formValue.email || '',
      phone: formValue.phone || '',
      companyName: formValue.companyName,
      role: '',
      photoUrl: this.photoDataUrl(),
      visitType: formValue.visitType || 'Others',
      purpose: formValue.purpose,
      hostId: formValue.hostId,
      status: 'PENDING_APPROVAL',
      registrationPath: 'walk-in',
      checkInTime: null,
      checkOutTime: null,
      expectedStartTime: null,
      expectedEndTime: null,
      tempCardNo: '',
      additionalInfo: '',
      sponsorLOS: ''
    }).pipe(
      catchError(this.errorService.handleError('Failed to register walk-in visitor.'))
    ).subscribe(visitor => {
      this.visitorService.addApprovalRequest$({
        visitorId: visitor.id,
        hostId: visitor.hostId,
        eventTitle: formValue.purpose,
        visitType: visitor.visitType,
        office: 'Main Reception',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default 2 hrs
        personalNote: '',
        status: 'PENDING'
      }).pipe(
        catchError(this.errorService.handleError('Failed to create approval request.'))
      ).subscribe(() => {
        this.isSubmitting.set(false);
        this.snackBar.open('Registration submitted for host approval!', 'OK', { duration: 5000 });
        this.router.navigate(['/dashboard']);
      });
    });
  }
}
