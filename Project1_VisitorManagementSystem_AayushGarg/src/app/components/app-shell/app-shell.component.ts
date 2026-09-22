import { Component, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  
  isMobile = signal(false);
  currentRoute = signal('');

  navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Invite Visitor', route: '/register/invite', icon: 'mail' },
    { label: 'Walk-in Check-in', route: '/register/walk-in', icon: 'person_add' },
    { label: 'Approvals', route: '/approvals', icon: 'check_circle' },
    { label: 'Pre-Approvals', route: '/pre-approvals', icon: 'event_available' }
  ];

  constructor() {
    this.breakpointObserver
      .observe(['(max-width: 959px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: any) => {
      this.currentRoute.set(event.urlAfterRedirects.split('?')[0]);
    });
  }

  isActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }
}
