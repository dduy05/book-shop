import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContactDialogComponent } from '../../components/contact-dialog/contact-dialog';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.scss'
})
export class TermsOfServiceComponent {
  currentDate = new Date().toLocaleDateString('vi-VN');
  isContactDialogOpen = signal<boolean>(false);

  openContactDialog(event: Event): void {
    event.preventDefault();
    this.isContactDialogOpen.set(true);
  }
}
