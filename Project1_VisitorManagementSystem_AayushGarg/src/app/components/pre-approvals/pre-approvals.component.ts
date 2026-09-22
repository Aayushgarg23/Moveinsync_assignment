import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VisitorService } from '../../services/visitor.service';
import { Visitor, Host } from '../../models/visitor.model';
import { forkJoin, map } from 'rxjs';
import { VisitorStatusPipe } from '../../pipes/visitor-status.pipe';

@Component({
  selector: 'app-pre-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    VisitorStatusPipe
  ],
  templateUrl: './pre-approvals.component.html',
  styleUrl: './pre-approvals.component.scss'
})
export class PreApprovalsComponent implements OnInit {
  private visitorService = inject(VisitorService);
  private snackBar = inject(MatSnackBar);

  preApprovals = signal<(Visitor & { host?: Host })[]>([]);
  isLoading = signal(true);
  processingId = signal<string | null>(null);

  displayedColumns = ['visitorName', 'hostName', 'visitType', 'date', 'timeWindow', 'expiresAt', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    forkJoin({
      visitors: this.visitorService.getVisitors$(),
      hosts: this.visitorService.getHosts$()
    }).pipe(
      map(({ visitors, hosts }) => {
        return visitors
          .filter(v => v.status === 'PRE_APPROVED')
          .map(v => ({
            ...v,
            host: hosts.find(h => h.id === v.hostId)
          }));
      })
    ).subscribe(data => {
      this.preApprovals.set(data);
      this.isLoading.set(false);
    });
  }

  cancelPreApproval(visitorId: string) {
    this.processingId.set(visitorId);
    this.visitorService.updateVisitorStatus$(visitorId, 'CANCELLED').subscribe(updated => {
      this.processingId.set(null);
      if (updated) {
        this.snackBar.open('Pre-approval cancelled successfully', 'OK', { duration: 3000 });
        this.preApprovals.update(list => list.filter(v => v.id !== visitorId));
      }
    });
  }

  getTimeRemaining(endTime: Date | null): string {
    if (!endTime) return 'N/A';
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    
    if (end < now) return 'Expired';

    const diffMs = end - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day(s) remaining`;
    }

    if (diffHours > 0) {
      return `${diffHours} hr ${diffMins} min remaining`;
    }

    return `${diffMins} min remaining`;
  }
}
