import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  templateUrl: './contact-dialog.html',
  styleUrl: './contact-dialog.scss'
})
export class ContactDialogComponent {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  name = signal<string>('');
  email = signal<string>('');
  subject = signal<string>('');
  message = signal<string>('');

  loading = signal<boolean>(false);

  closeDialog(): void {
    this.visibleChange.emit(false);
  }

  submitContact(): void {
    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    const subjectVal = this.subject().trim();
    const messageVal = this.message().trim();

    if (!nameVal || !emailVal || !subjectVal || !messageVal) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Thiếu thông tin',
        detail: 'Vui lòng nhập đầy đủ các trường thông tin.'
      });
      return;
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Email không hợp lệ',
        detail: 'Vui lòng nhập đúng định dạng email.'
      });
      return;
    }

    this.loading.set(true);

    const body = {
      name: nameVal,
      email: emailVal,
      subject: subjectVal,
      message: messageVal
    };

    this.http.post('http://localhost:3000/api/contact', body).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Gửi thành công',
          detail: 'Cảm ơn bạn! Tin nhắn của bạn đã được chuyển tới chúng tôi.',
          life: 4000
        });

        // Reset form
        this.name.set('');
        this.email.set('');
        this.subject.set('');
        this.message.set('');

        // Close dialog
        this.closeDialog();
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Lỗi khi gửi liên hệ:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Thất bại',
          detail: err.error?.message || 'Có lỗi xảy ra trong quá trình gửi. Vui lòng thử lại.'
        });
      }
    });
  }
}
