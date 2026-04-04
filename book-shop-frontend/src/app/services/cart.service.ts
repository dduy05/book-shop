import { computed, Injectable, signal } from '@angular/core';
import { Book } from '../models/book.model';

export interface CartItem extends Book {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  cartItems = signal<CartItem[]>([]);

  totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  addToCart(book: Book): void {
    this.cartItems.update(items => {
      const existing = items.find(i => i.id === book.id);
      if (existing) {
        return items.map(i =>
          i.id === book.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...items, { ...book, quantity: 1 }];
    });
  }

  removeFromCart(bookId: number): void {
    this.cartItems.update(items => items.filter(i => i.id !== bookId));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }
}
