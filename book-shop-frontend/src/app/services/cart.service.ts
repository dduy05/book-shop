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

  addToCart(book: Book, qty = 1): boolean {
    const available = book.quantity ?? 0;
    if (qty < 1) {
      return false;
    }

    const existing = this.cartItems().find(i => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + qty > available) {
      return false;
    }

    this.cartItems.update(items => {
      if (existing) {
        return items.map(i =>
          i.id === book.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...items, { ...book, quantity: qty }];
    });

    return true;
  }

  removeFromCart(bookId: number): void {
    this.cartItems.update(items => items.filter(i => i.id !== bookId));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }
}
