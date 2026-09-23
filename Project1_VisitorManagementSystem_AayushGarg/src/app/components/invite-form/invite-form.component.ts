import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { VisitorService } from '../../services/visitor.service';
import { VisitType } from '../../models/visitor.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of, finalize } from 'rxjs';
import { QrDialogComponent } from '../qr-dialog/qr-dialog.component';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';

interface GuestEntry {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'visitor' | 'host';
}

@Component({
  selector: 'app-invite-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatDividerModule,
    MatCardModule,
    MatDialogModule,
    RouterModule
  ],
  templateUrl: './invite-form.component.html',
  styleUrl: './invite-form.component.scss'
})
export class InviteFormComponent {
  private fb = inject(FormBuilder);
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  private errorService = inject(ErrorSnackbarService);

  isSubmitting = signal(false);

  visitTypes: VisitType[] = [
    'Business Guests', 'Vendor', 'Personnel', 'Govt Officials', 'Interview', 'Others'
  ];

  offices = ['Bangalore HQ', 'Mumbai Office', 'Delhi NCR', 'Hyderabad Tech Park'];

  timeSlots: string[] = [];

  // ── Guest search ────────────────────────────────────────────────────
  searchQuery = signal('');
  searchResults = signal<GuestEntry[]>([]);
  addedGuests = signal<GuestEntry[]>([]);
  isSearching = signal(false);
  private searchSubject = new Subject<string>();

  // ── Form ────────────────────────────────────────────────────────────
  inviteForm: FormGroup = this.fb.group({
    eventTitle: ['', Validators.required],
    visitType: ['', Validators.required],
    office: ['', Validators.required],
    date: [null as Date | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    personalNote: ['']
  });

  constructor() {
    this.generateTimeSlots();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching.set(true);
        return this.visitorService.searchContacts$(query).pipe(
          catchError(() => {
            this.errorService.showError('Search failed to load.');
            return of([]);
          })
        );
      })
    ).subscribe(results => {
      const addedIds = new Set(this.addedGuests().map(g => g.id));
      this.searchResults.set(results.filter(r => !addedIds.has(r.id)));
      this.isSearching.set(false);
    });
  }

  private generateTimeSlots(): void {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0');
        const min = m.toString().padStart(2, '0');
        slots.push(`${hour}:${min}`);
      }
    }
    this.timeSlots = slots;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  addGuest(guest: GuestEntry): void {
    this.addedGuests.update(list => [...list, guest]);
    this.searchResults.update(list => list.filter(r => r.id !== guest.id));
    this.searchQuery.set('');
    this.searchResults.set([]);
  }

  removeGuest(guestId: string): void {
    this.addedGuests.update(list => list.filter(g => g.id !== guestId));
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    if (this.addedGuests().length === 0) {
      this.errorService.showError('Please add at least one guest');
      return;
    }

    const formValue = this.inviteForm.value;
    const guests = this.addedGuests();
    const hostId = guests[0]?.type === 'host' ? guests[0].id : 'h1'; // Default host logic
    
    // Check max 5 pre-approvals limit
    const currentPreApprovals = this.visitorService.getPreApprovalCountForHost(hostId, formValue.date);
    if (currentPreApprovals + guests.length > 5) {
      this.errorService.showError('Daily pre-approval limit reached (5/day) for this host.');
      return;
    }

    this.isSubmitting.set(true);

    let completed = 0;
    const total = guests.length;

    for (const guest of guests) {
      const date: Date = formValue.date;
      const [startH, startM] = (formValue.startTime as string).split(':').map(Number);
      const [endH, endM] = (formValue.endTime as string).split(':').map(Number);
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM);
      const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM);

      this.visitorService.addVisitor$({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        companyName: '',
        role: '',
        photoUrl: '',
        visitType: formValue.visitType,
        purpose: formValue.eventTitle,
        hostId: hostId,
        status: 'PRE_APPROVED', // Directly pre-approved!
        registrationPath: 'pre-invited',
        checkInTime: null,
        checkOutTime: null,
        expectedStartTime: startTime,
        expectedEndTime: endTime,
        tempCardNo: '',
        additionalInfo: formValue.personalNote || '',
        sponsorLOS: ''
      }).pipe(
        catchError(this.errorService.handleError(`Failed to add visitor ${guest.name}.`)),
        finalize(() => {
          if (completed + 1 === total) this.isSubmitting.set(false);
        })
      ).subscribe(visitor => {
        // Also create an approval request for record if needed, but per brief: "no wait"
        // Let's just create pre-approval record/pass
        this.visitorService.addPreApproval$({
          visitorId: visitor.id,
          hostId: visitor.hostId,
          date: date,
          startTime: startTime,
          endTime: endTime,
          qrCode: `QR-${visitor.id}`,
          isExpired: false
        }).pipe(
          catchError(this.errorService.handleError(`Failed to create pre-approval pass for ${guest.name}.`))
        ).subscribe(() => {
          completed++;
          
          // Open dialog with QR code for the last/only guest as immediate e-pass
          if (completed === total) {
            this.isSubmitting.set(false);
            
            this.dialog.open(QrDialogComponent, {
              data: {
                visitorName: visitor.name,
                visitorId: visitor.id,
                expectedStartTime: startTime,
                expectedEndTime: endTime
              },
              width: '400px'
            });

            this.inviteForm.reset();
            this.addedGuests.set([]);
          }
        });
      });
    }
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name.substring(0, 2)).toUpperCase();
  }

  getAvatarClass(name: string): string {
    if (!name) return 'bg-gray-100 text-gray-700';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-blue-100 text-blue-700'
    ];
    return colors[hash % colors.length];
  }
}
