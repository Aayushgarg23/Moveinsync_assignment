import { Component, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { VisitorService } from '../../services/visitor.service';
import { Visitor, Host } from '../../models/visitor.model';
import { forkJoin, map, catchError, finalize } from 'rxjs';
import { GuestDetailDialogComponent } from '../guest-detail-dialog/guest-detail-dialog.component';
import { VisitorStatusPipe } from '../../pipes/visitor-status.pipe';
import { ErrorSnackbarService } from '../../services/error-snackbar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    FormsModule,
    VisitorStatusPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private visitorService = inject(VisitorService);
  private dialog = inject(MatDialog);
  private errorService = inject(ErrorSnackbarService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  // Core data signals
  allVisitors = signal<(Visitor & { host?: Host })[]>([]);
  
  // State
  searchQuery = signal('');
  timeRange = signal<'all' | 'today' | 'last24' | 'week'>('all');
  selectedVisitor = signal<(Visitor & { host?: Host }) | null>(null);
  isMobile = signal(false);
  isProcessing = signal(false);

  // Mapped visitors with OVERSTAY logic applied
  visitorsWithOverstay = computed(() => {
    const now = new Date().getTime();
    return this.allVisitors().map(v => {
      if (v.status === 'CHECKED_IN' && v.checkInTime) {
        const checkInTime = new Date(v.checkInTime).getTime();
        const diffHours = (now - checkInTime) / (1000 * 60 * 60);
        if (diffHours >= 8) {
          return { ...v, status: 'OVERSTAY' as any }; 
        }
      }
      return v;
    });
  });

  // Filtered visitors
  filteredVisitors = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const range = this.timeRange();
    const now = new Date();
    
    let visitors = this.visitorsWithOverstay();
    
    // 1. Filter by Time Range
    if (range !== 'all') {
      visitors = visitors.filter(v => {
        const timeToCompare = v.checkInTime || v.expectedStartTime;
        if (!timeToCompare) return false;
        
        const date = new Date(timeToCompare);
        
        if (range === 'today') {
          return date.toDateString() === now.toDateString();
        } else if (range === 'last24') {
          const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
          return diffHours >= 0 && diffHours <= 24;
        } else if (range === 'week') {
          const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= 0 && diffDays <= 7;
        }
        return true;
      });
    }

    // 2. Filter by Search Query
    if (query) {
      visitors = visitors.filter(v => 
        v.name.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query) ||
        v.phone.includes(query)
      );
    }
    
    return visitors;
  });

  // Summaries
  totalCount = computed(() => this.filteredVisitors().length);
  checkedInCount = computed(() => this.filteredVisitors().filter(v => v.status === 'CHECKED_IN').length);
  overstayCount = computed(() => this.filteredVisitors().filter(v => v.status === 'OVERSTAY').length);

  displayedColumns = ['name', 'visitType', 'checkInTime', 'checkOutTime', 'status'];

  ngOnInit() {
    this.loadData();
    
    this.breakpointObserver
      .observe(['(max-width: 959px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        // If transitioning to mobile, clear selected visitor to close side panel
        if (result.matches && this.selectedVisitor()) {
          this.selectedVisitor.set(null);
        }
      });
  }

  resetFilters() {
    this.searchQuery.set('');
    this.timeRange.set('all');
  }

  loadData() {
    forkJoin({
      visitors: this.visitorService.getVisitors$(),
      hosts: this.visitorService.getHosts$()
    }).pipe(
      catchError(this.errorService.handleError('Failed to load dashboard data.')),
      map(({ visitors, hosts }) => {
        return visitors.map(v => ({
          ...v,
          host: hosts.find(h => h.id === v.hostId)
        }));
      })
    ).subscribe(data => {
      this.allVisitors.set(data);
      // Refresh selected visitor if it exists
      const selected = this.selectedVisitor();
      if (selected) {
        const updated = data.find(v => v.id === selected.id);
        if (updated) this.selectedVisitor.set(updated);
      }
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  openGuestDetail(visitor: Visitor & { host?: Host }) {
    if (this.isMobile()) {
      const dialogRef = this.dialog.open(GuestDetailDialogComponent, {
        data: { visitor },
        width: '100%',
        maxWidth: '600px',
        panelClass: 'responsive-dialog'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadData();
        }
      });
    } else {
      this.selectedVisitor.set(visitor);
    }
  }

  openFullRecordDialog(visitor: Visitor & { host?: Host }) {
    const dialogRef = this.dialog.open(GuestDetailDialogComponent, {
      data: { visitor },
      width: '100%',
      maxWidth: '600px',
      panelClass: 'responsive-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadData();
      }
    });
  }

  simulateCheckIn() {
    const visitor = this.selectedVisitor();
    if (!visitor) return;
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(visitor.id, 'CHECKED_IN').pipe(
      catchError(this.errorService.handleError('Failed to check in visitor.')),
      finalize(() => this.isProcessing.set(false))
    ).subscribe(() => {
      this.snackBar.open('Visitor checked in successfully', 'OK', { duration: 3000 });
      this.loadData();
    });
  }

  checkOut() {
    const visitor = this.selectedVisitor();
    if (!visitor) return;
    this.isProcessing.set(true);
    this.visitorService.updateVisitorStatus$(visitor.id, 'CHECKED_OUT').pipe(
      catchError(this.errorService.handleError('Failed to check out visitor.')),
      finalize(() => this.isProcessing.set(false))
    ).subscribe(() => {
      this.snackBar.open('Visitor checked out successfully', 'OK', { duration: 3000 });
      this.loadData();
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
