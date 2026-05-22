import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContactDialogComponent } from '../contact-dialog/contact-dialog';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactDialogComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  currentYear: number = new Date().getFullYear();
  isContactDialogOpen = signal<boolean>(false);

  openContactDialog(event: Event): void {
    event.preventDefault();
    this.isContactDialogOpen.set(true);
  }
}
