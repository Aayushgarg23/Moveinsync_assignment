import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'visitorStatus',
  standalone: true
})
export class VisitorStatusPipe implements PipeTransform {
  
  private statusMap: Record<string, string> = {
    'PENDING_APPROVAL': 'Pending Approval',
    'PRE_APPROVED': 'Expected',
    'CHECKED_IN': 'Checked In',
    'CHECKED_OUT': 'Checked Out',
    'SELF_CHECK_OUT': 'Self Check-Out',
    'OVERSTAY': 'Overstay',
    'DENIED': 'Denied',
    'EXPIRED': 'Expired',
    'CANCELLED': 'Cancelled'
  };

  transform(value: string | undefined | null): string {
    if (!value) return '';
    return this.statusMap[value] || value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
