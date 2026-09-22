import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { VisitorService } from '../../services/visitor.service';
import { Visitor, Host } from '../../models/visitor.model';
import { forkJoin, map } from 'rxjs';
import { GuestDetailDialogComponent } from '../guest-detail-dialog/guest-detail-dialog.component';

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
    FormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private visitorService = inject(VisitorService);
  private dialog = inject(MatDialog);

  // Core data signals
  allVisitors = signal<(Visitor & { host?: Host })[]>([]);
  
  // State
  searchQuery = signal('');
  selectedVisitor = signal<Visitor | null>(null);

  // Mapped visitors with OVERSTAY logic applied
  visitorsWithOverstay = computed(() => {
    const now = new Date().getTime();
    return this.allVisitors().map(v => {
      if (v.status === 'CHECKED_IN' && v.checkInTime) {
        const checkInTime = new Date(v.checkInTime).getTime();
        const diffHours = (now - checkInTime) / (1000 * 60 * 60);
        if (diffHours >= 8) {
          return { ...v, status: 'OVERSTAY' as any }; // Cast to any to accommodate dynamic overstay status for UI
        }
      }
      return v;
    });
  });

  // Filtered visitors
  filteredVisitors = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const visitors = this.visitorsWithOverstay();
    if (!query) return visitors;
    
    return visitors.filter(v => 
      v.name.toLowerCase().includes(query) ||
      v.email.toLowerCase().includes(query) ||
      v.phone.includes(query)
    );
  });

  // Summaries
  totalCount = computed(() => this.visitorsWithOverstay().length);
  checkedInCount = computed(() => this.visitorsWithOverstay().filter(v => v.status === 'CHECKED_IN').length);
  overstayCount = computed(() => this.visitorsWithOverstay().filter(v => v.status === 'OVERSTAY').length);

  displayedColumns = ['name', 'visitType', 'checkInTime', 'checkOutTime', 'status'];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      visitors: this.visitorService.getVisitors$(),
      hosts: this.visitorService.getHosts$()
    }).pipe(
      map(({ visitors, hosts }) => {
        return visitors.map(v => ({
          ...v,
          host: hosts.find(h => h.id === v.hostId)
        }));
      })
    ).subscribe(data => {
      this.allVisitors.set(data);
    });
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  openGuestDetail(visitor: Visitor & { host?: Host }) {
    this.selectedVisitor.set(visitor);
    const dialogRef = this.dialog.open(GuestDetailDialogComponent, {
      data: { visitor },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.selectedVisitor.set(null);
      if (result) {
        // Reload if an action was taken
        this.loadData();
      }
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'OVERSTAY': return 'bg-red-100 text-red-700 font-bold';
      case 'SELF_CHECK_OUT': return 'bg-gray-200 text-gray-700';
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-600';
      case 'CHECKED_IN': return 'bg-green-100 text-green-800';
      case 'PRE_APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PENDING_APPROVAL': return 'bg-yellow-100 text-yellow-800';
      case 'DENIED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-300 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
