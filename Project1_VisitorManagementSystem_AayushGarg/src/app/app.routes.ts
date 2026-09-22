import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'register/invite', pathMatch: 'full' },
  {
    path: 'register/invite',
    loadComponent: () =>
      import('./components/invite-form/invite-form.component').then(m => m.InviteFormComponent)
  },
  {
    path: 'register/walk-in',
    loadComponent: () =>
      import('./components/walk-in-form/walk-in-form.component').then(m => m.WalkInFormComponent)
  }
];
