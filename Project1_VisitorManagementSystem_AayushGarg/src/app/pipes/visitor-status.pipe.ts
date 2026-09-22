import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'visitorStatus',
  standalone: true
})
export class VisitorStatusPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    return value.replace(/_/g, ' ');
  }
}
