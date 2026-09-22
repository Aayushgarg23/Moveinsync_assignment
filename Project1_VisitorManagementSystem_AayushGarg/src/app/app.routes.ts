import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'register/invite',
    loadComponent: () =>
      import('./components/invite-form/invite-form.component').then(m => m.InviteFormComponent)
  },
  {
    path: 'register/walk-in',
    loadComponent: () =>
      import('./components/walk-in-form/walk-in-form.component').then(m => m.WalkInFormComponent)
  },
  {
    path: 'approvals',
    loadComponent: () =>
      import('./components/approvals/approvals.component').then(m => m.ApprovalsComponent)
  },
  {
    path: 'pre-approvals',
    loadComponent: () =>
      import('./components/pre-approvals/pre-approvals.component').then(m => m.PreApprovalsComponent)
  }
];
