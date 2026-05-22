import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Book } from '../models/book.model';

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface CartItem extends Book {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/cart';
  private readonly STORAGE_KEY = 'bookshop_cart';

  cartItems = signal<CartItem[]>([]);

  totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  totalPrice = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  constructor() {
    const token = localStorage.getItem('token');
    if (token) {
      this.loadCart();
    } else {
      // Nếu chưa đăng nhập, tải giỏ hàng từ localStorage
      this.loadCartFromStorage();
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // Lưu giỏ hàng vào localStorage
  private saveCartToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems()));
    } catch (err) {
      console.error('Lỗi khi lưu giỏ hàng:', err);
    }
  }

  // Tải giỏ hàng từ localStorage
  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItem[];
        this.cartItems.set(items);
      }
    } catch (err) {
      console.error('Lỗi khi tải giỏ hàng từ localStorage:', err);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  loadCart(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.cartItems.set([]);
      return;
    }

    this.getCart().subscribe({
      next: (items) => {
        this.cartItems.set(items);
        this.saveCartToStorage(); // Lưu vào localStorage
      },
      error: (err) => {
        console.error('Lỗi khi tải giỏ hàng:', err);
        this.cartItems.set([]);
      }
    });
  }

  getCart(): Observable<CartItem[]> {
    return this.http.get<ApiResponse<CartItem[]>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map((res) => res.data)
    );
  }

  private canAdd(book: Book, qty = 1): boolean {
    const available = book.quantity ?? 0;
    
    // Kiểm tra nếu sách đã hết hàng
    if (available <= 0) {
      console.warn(`Sách "${book.title}" đã hết hàng`);
      return false;
    }

    if (qty < 1) {
      return false;
    }

    const existing = this.cartItems().find(i => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;
    return currentQty + qty <= available;
  }

  addToCart(book: Book, qty = 1): boolean {
    if (!this.canAdd(book, qty)) {
      return false;
    }

    const existing = this.cartItems().find(i => i.id === book.id);

    this.cartItems.update(items => {
      if (existing) {
        return items.map(i =>
          i.id === book.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...items, { ...book, quantity: qty }];
    });

    this.saveCartToStorage(); // Lưu vào localStorage
    return true;
  }

  addToCartRemote(book: Book, qty = 1): Observable<CartItem | null> {
    if (!this.canAdd(book, qty)) {
      return of(null);
    }

    return this.http.post<ApiResponse<CartItem>>(this.apiUrl, {
      book_id: book.id,
      quantity: qty
    }, { headers: this.getHeaders() }).pipe(
      tap(() => this.addToCart(book, qty)),
      map((res) => res.data),
      catchError((err) => {
        console.error('Lỗi khi đồng bộ giỏ hàng:', err);
        return of(null);
      })
    );
  }

  removeFromCart(bookId: number): CartItem | null {
    const itemToRemove = this.cartItems().find(i => i.id === bookId);
    if (itemToRemove) {
      this.cartItems.update(items => items.filter(i => i.id !== bookId));
      this.saveCartToStorage(); // Lưu vào localStorage
      return itemToRemove;
    }
    return null;
  }

  removeFromCartRemote(bookId: number): Observable<CartItem | null> {
    const itemToRemove = this.cartItems().find(i => i.id === bookId);
    if (!itemToRemove) {
      return of(null);
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${bookId}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.removeFromCart(bookId); // Cập nhật local + lưu localStorage
      }),
      map(() => itemToRemove),
      catchError((err) => {
        console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
        return of(null);
      })
    );
  }

  clearCart(): CartItem[] {
    const items = this.cartItems();
    this.cartItems.set([]);
    this.saveCartToStorage(); // Lưu vào localStorage (xóa toàn bộ)
    return items;
  }

  clearCartRemote(): Observable<CartItem[]> {
    const items = this.cartItems();
    return this.http.delete<ApiResponse<any>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.clearCart(); // Cập nhật local + lưu localStorage
      }),
      map(() => items),
      catchError((err) => {
        console.error('Lỗi khi xóa toàn bộ giỏ hàng:', err);
        return of([]);
      })
    );
  }

  clearLocalCart(): void {
    this.cartItems.set([]);
  }
}
