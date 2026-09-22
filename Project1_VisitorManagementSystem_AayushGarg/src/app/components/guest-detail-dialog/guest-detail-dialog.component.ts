import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Visitor, Host } from '../../models/visitor.model';
import { VisitorService } from '../../services/visitor.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './guest-detail-dialog.component.html',
  styleUrl: './guest-detail-dialog.component.scss'
})
export class GuestDetailDialogComponent {
  visitor: Visitor & { host?: Host };
  isProcessing = signal(false);

  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<GuestDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GuestDetailData
  ) {
    this.visitor = data.visitor;
  }

  simulateCheckIn() {
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(this.visitor.id, 'CHECKED_IN').subscribe(() => {
      this.isProcessing.set(false);
      this.snackBar.open('Visitor checked in successfully', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    });
  }

  checkOut() {
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(this.visitor.id, 'CHECKED_OUT').subscribe(() => {
      this.isProcessing.set(false);
      this.snackBar.open('Visitor checked out successfully', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    });
  }
}
