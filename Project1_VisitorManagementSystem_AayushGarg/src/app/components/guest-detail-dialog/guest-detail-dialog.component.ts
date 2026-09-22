import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Visitor, Host } from '../../models/visitor.model';
import { VisitorService } from '../../services/visitor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VisitorStatusPipe } from '../../pipes/visitor-status.pipe';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
import { catchError, finalize } from 'rxjs';

export interface GuestDetailData {
  visitor: Visitor & { host?: Host };
}

@Component({
  selector: 'app-guest-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    VisitorStatusPipe
  ],
  templateUrl: './guest-detail-dialog.component.html',
  styleUrl: './guest-detail-dialog.component.scss'
})
export class GuestDetailDialogComponent {
  visitor: Visitor & { host?: Host };
  isProcessing = signal(false);
  localNotes = signal('');

  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);
  private errorService = inject(ErrorSnackbarService);

  constructor(
    public dialogRef: MatDialogRef<GuestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuestDetailData
  ) {
    this.visitor = data.visitor;
    this.localNotes.set(this.visitor.additionalInfo || '');
  }

  simulateCheckIn() {
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(this.visitor.id, 'CHECKED_IN').pipe(
      catchError(this.errorService.handleError('Failed to check in visitor.')),
      finalize(() => this.isProcessing.set(false))
    ).subscribe(() => {
      this.snackBar.open('Visitor checked in successfully', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    });
  }

  checkOut() {
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(this.visitor.id, 'CHECKED_OUT').pipe(
      catchError(this.errorService.handleError('Failed to check out visitor.')),
      finalize(() => this.isProcessing.set(false))
    ).subscribe(() => {
      this.snackBar.open('Visitor checked out successfully', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'OVERSTAY': return 'bg-red-50 text-red-700 border border-red-200 font-medium';
      case 'CHECKED_IN': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium';
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border border-amber-200 font-medium';
      case 'PRE_APPROVED': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium';
      case 'DENIED': return 'bg-rose-50 text-rose-700 border border-rose-200 font-medium';
      case 'CHECKED_OUT': return 'bg-gray-50 text-gray-700 border border-gray-200 font-medium';
      case 'SELF_CHECK_OUT': return 'bg-gray-100 text-gray-700 border border-gray-300 font-medium';
      case 'EXPIRED': return 'bg-slate-50 text-slate-700 border border-slate-200 font-medium';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200 font-medium';
    }
  }
}
