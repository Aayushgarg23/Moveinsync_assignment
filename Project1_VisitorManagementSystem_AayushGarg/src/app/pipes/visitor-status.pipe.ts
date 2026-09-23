import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'visitorStatus',
  standalone: true
})
export class VisitorStatusPipe implements PipeTransform {
  
  /**
   * Explicit label map ensures raw enum values (e.g. PENDING_APPROVAL) are
   * never shown in the UI. Using a dictionary rather than string.replace() means
   * adding a new status only requires one entry here, not regex changes across templates.
   */
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
    // Fallback: if a new status arrives that's not in the map, convert SNAKE_CASE → Title Case
    return this.statusMap[value] || value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
