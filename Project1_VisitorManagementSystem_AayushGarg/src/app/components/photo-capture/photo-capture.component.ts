import {
  Component, ElementRef, ViewChild, Output, EventEmitter,
  signal, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-photo-capture',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './photo-capture.component.html',
  styleUrl: './photo-capture.component.scss'
})
export class PhotoCaptureComponent implements OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Output() photoCaptured = new EventEmitter<string>();

  cameraMode = signal<'idle' | 'streaming' | 'captured' | 'fallback'>('idle');
  capturedPhoto = signal('');
  cameraError = signal('');

  private stream: MediaStream | null = null;

  async startCamera(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available in this browser');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });

      // Wait for ViewChild to be available
      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = this.stream;
          this.videoRef.nativeElement.play();
          this.cameraMode.set('streaming');
        }
      }, 100);
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      this.cameraError.set(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied.'
          : 'Camera is not available.'
      );
      this.cameraMode.set('fallback');
    }
  }

  captureFrame(): void {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      this.capturedPhoto.set(dataUrl);
      this.photoCaptured.emit(dataUrl);
      this.cameraMode.set('captured');
      this.stopStream();
    }
  }

  retake(): void {
    this.capturedPhoto.set('');
    this.photoCaptured.emit('');
    this.startCamera();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.capturedPhoto.set(dataUrl);
        this.photoCaptured.emit(dataUrl);
        this.cameraMode.set('captured');
      };
      reader.readAsDataURL(file);
    }
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
  }
}
