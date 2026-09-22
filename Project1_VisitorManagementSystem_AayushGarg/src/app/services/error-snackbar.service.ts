import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorSnackbarService {
  private snackBar = inject(MatSnackBar);

  showError(message: string, action: string = 'Close') {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['bg-red-600', 'text-white'], // optional styling via Tailwind or global CSS
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  handleError(fallbackMessage: string) {
    return (error: any): Observable<never> => {
      const errorMsg = typeof error === 'string' ? error : (error?.message || fallbackMessage);
      this.showError(errorMsg);
      return throwError(() => new Error(errorMsg));
    };
  }
}
