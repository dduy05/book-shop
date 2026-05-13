import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Book } from '../models/book.model';

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/wishlist';

  wishlistItems = signal<Book[]>([]);
  totalItems = computed(() => this.wishlistItems().length);

  constructor() {
    this.loadWishlist();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  loadWishlist(): void {
    if (!this.isLoggedIn()) {
      this.wishlistItems.set([]);
      return;
    }

    this.http.get<ApiResponse<Book[]>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res.data),
      catchError(err => {
        console.error('Lỗi khi tải wishlist:', err);
        this.wishlistItems.set([]);
        return of([] as Book[]);
      })
    ).subscribe(data => this.wishlistItems.set(data));
  }

  addToWishlist(book: Book): Observable<Book | null> {
    if (!this.isLoggedIn()) {
      return of(null);
    }

    return this.http.post<ApiResponse<Book>>(this.apiUrl, { book_id: book.id }, { headers: this.getHeaders() }).pipe(
      tap(res => {
        const addedBook = res.data;
        if (addedBook && !this.isInWishlist(addedBook.id)) {
          this.wishlistItems.update(items => [...items, addedBook]);
        }
      }),
      map(res => res.data),
      catchError(err => {
        console.error('Lỗi khi thêm wishlist:', err);
        return of(null);
      })
    );
  }

  removeFromWishlist(bookId: number): Observable<boolean> {
    if (!this.isLoggedIn()) {
      return of(false);
    }

    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${bookId}`, { headers: this.getHeaders() }).pipe(
      tap(() => {
        this.wishlistItems.update(items => items.filter(item => item.id !== bookId));
      }),
      map(() => true),
      catchError(err => {
        console.error('Lỗi khi xóa wishlist:', err);
        return of(false);
      })
    );
  }

  clearWishlist(): Observable<boolean> {
    if (!this.isLoggedIn()) {
      return of(false);
    }

    return this.http.delete<ApiResponse<null>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(() => this.wishlistItems.set([])),
      map(() => true),
      catchError(err => {
        console.error('Lỗi khi xóa toàn bộ wishlist:', err);
        return of(false);
      })
    );
  }

  isInWishlist(bookId: number): boolean {
    return this.wishlistItems().some(item => item.id === bookId);
  }
}
