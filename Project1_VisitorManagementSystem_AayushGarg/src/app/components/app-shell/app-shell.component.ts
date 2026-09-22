import { Component, inject, signal, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isMobile = signal(false);

  navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Invite Visitor', route: '/register/invite', icon: 'mail' },
    { label: 'Walk-in Check-in', route: '/register/walk-in', icon: 'person_add' },
    { label: 'Approvals', route: '/approvals', icon: 'check_circle' },
    { label: 'Pre-Approvals', route: '/pre-approvals', icon: 'event_available' }
  ];

  constructor() {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.isMobile.set(result.matches);
        // Automatically close the sidenav on mobile when navigating, if needed.
      });
  }

  closeSidenavIfMobile() {
    if (this.isMobile() && this.sidenav) {
      this.sidenav.close();
    }
  }
}
