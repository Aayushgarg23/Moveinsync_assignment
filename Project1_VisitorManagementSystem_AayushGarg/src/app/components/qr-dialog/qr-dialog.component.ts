import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeModule } from 'angularx-qrcode';

export interface QrDialogData {
  visitorName: string;
  visitorId: string;
  expectedStartTime: Date;
  expectedEndTime: Date;
}

@Component({
  selector: 'app-qr-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    QRCodeModule
  ],
  providers: [DatePipe],
  templateUrl: './qr-dialog.component.html',
  styleUrl: './qr-dialog.component.scss'
})
export class QrDialogComponent {
  qrData: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: QrDialogData) {
    this.qrData = JSON.stringify({
      id: data.visitorId,
      name: data.visitorName,
      start: data.expectedStartTime.toISOString(),
      end: data.expectedEndTime.toISOString()
    });
  }
}
