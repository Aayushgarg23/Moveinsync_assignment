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
import { VisitorService } from '../../services/visitor.service';
import { VisitType } from '../../models/visitor.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

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
    MatDividerModule
  ],
  templateUrl: './invite-form.component.html',
  styleUrl: './invite-form.component.scss'
})
export class InviteFormComponent {
  private fb = inject(FormBuilder);
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);

  visitTypes: VisitType[] = [
    'Business Guests', 'Vendor', 'Personnel', 'Govt Officials', 'Interview', 'Others'
  ];

  offices = ['Bangalore HQ', 'Mumbai Office', 'Delhi NCR', 'Hyderabad Tech Park'];

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
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching.set(true);
        return this.visitorService.searchContacts$(query);
      })
    ).subscribe(results => {
      // Filter out already-added guests
      const addedIds = new Set(this.addedGuests().map(g => g.id));
      this.searchResults.set(results.filter(r => !addedIds.has(r.id)));
      this.isSearching.set(false);
    });
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
      this.snackBar.open('Please add at least one guest', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.inviteForm.value;
    const guests = this.addedGuests();

    // Create a visitor + approval request for each guest
    let completed = 0;
    const total = guests.length;

    for (const guest of guests) {
      // Build date+time combinations
      const date: Date = formValue.date;
      const [startH, startM] = (formValue.startTime as string).split(':').map(Number);
      const [endH, endM] = (formValue.endTime as string).split(':').map(Number);
      const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startH, startM);
      const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endH, endM);

      // Add visitor with PENDING status
      this.visitorService.addVisitor$({
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        companyName: '',
        role: '',
        photoUrl: '',
        visitType: formValue.visitType,
        purpose: formValue.eventTitle,
        hostId: guests[0]?.type === 'host' ? guest.id : 'h1', // default host
        status: 'PENDING',
        registrationPath: 'pre-invited',
        checkInTime: null,
        checkOutTime: null,
        expectedStartTime: startTime,
        expectedEndTime: endTime,
        tempCardNo: '',
        additionalInfo: formValue.personalNote || '',
        sponsorLOS: ''
      }).subscribe(visitor => {
        // Also create an approval request
        this.visitorService.addApprovalRequest$({
          visitorId: visitor.id,
          hostId: visitor.hostId,
          eventTitle: formValue.eventTitle,
          visitType: formValue.visitType,
          office: formValue.office,
          date: date,
          startTime: startTime,
          endTime: endTime,
          personalNote: formValue.personalNote || '',
          status: 'PENDING'
        }).subscribe(() => {
          completed++;
          if (completed === total) {
            this.isSubmitting.set(false);
            this.snackBar.open(
              `Invitation sent for ${total} guest(s) — pending host approval`,
              'OK',
              { duration: 4000 }
            );
            this.inviteForm.reset();
            this.addedGuests.set([]);
          }
        });
      });
    }
  }
}
