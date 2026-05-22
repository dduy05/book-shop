import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactDialogComponent } from '../../components/contact-dialog/contact-dialog';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss'
})
export class PrivacyPolicyComponent {
  currentDate = new Date().toLocaleDateString('vi-VN');
  isContactDialogOpen = signal<boolean>(false);

  openContactDialog(event: Event): void {
    event.preventDefault();
    this.isContactDialogOpen.set(true);
  }
}
