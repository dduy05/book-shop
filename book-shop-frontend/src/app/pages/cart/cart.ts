import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent {
  protected cartService = inject(CartService);

  removeFromCart(bookId: number): void {
    this.cartService.removeFromCart(bookId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }
}
