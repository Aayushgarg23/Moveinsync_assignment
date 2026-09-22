import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VisitorService } from '../../services/visitor.service';
import { Visitor, Host } from '../../models/visitor.model';
import { QrDialogComponent } from '../qr-dialog/qr-dialog.component';
import { forkJoin, map } from 'rxjs';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.scss'
})
export class ApprovalsComponent implements OnInit {
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  pendingVisitors = signal<(Visitor & { host?: Host })[]>([]);
  isLoading = signal(true);
  processingId = signal<string | null>(null);

  ngOnInit() {
    this.loadPendingRequests();
  }

  loadPendingRequests() {
    this.isLoading.set(true);
    forkJoin({
      visitors: this.visitorService.getVisitors$(),
      hosts: this.visitorService.getHosts$()
    }).pipe(
      map(({ visitors, hosts }) => {
        return visitors
          .filter(v => v.status === 'PENDING_APPROVAL')
          .map(v => ({ ...v, host: hosts.find(h => h.id === v.hostId) }));
      })
    ).subscribe(data => {
      this.pendingVisitors.set(data);
      this.isLoading.set(false);
    });
  }

  approve(visitor: Visitor) {
    this.processingId.set(visitor.id);
    this.visitorService.updateVisitorStatus$(visitor.id, 'CHECKED_IN').subscribe(updated => {
      this.processingId.set(null);
      if (updated) {
        this.snackBar.open('Visitor approved and checked in', 'OK', { duration: 3000 });
        
        // Remove from list
        this.pendingVisitors.update(list => list.filter(v => v.id !== visitor.id));

        // Open QR Dialog
        const expectedStart = updated.expectedStartTime || new Date();
        const expectedEnd = updated.expectedEndTime || new Date(new Date().setHours(23, 59, 59));
        
        this.dialog.open(QrDialogComponent, {
          data: {
            visitorName: updated.name,
            visitorId: updated.id,
            expectedStartTime: expectedStart,
            expectedEndTime: expectedEnd
          },
          width: '400px'
        });
      }
    });
  }

  reject(visitor: Visitor) {
    this.processingId.set(visitor.id);
    this.visitorService.updateVisitorStatus$(visitor.id, 'DENIED').subscribe(updated => {
      this.processingId.set(null);
      if (updated) {
        this.snackBar.open('Visitor denied, security notified', 'OK', { duration: 3000 });
        this.pendingVisitors.update(list => list.filter(v => v.id !== visitor.id));
      }
    });
  }
}
