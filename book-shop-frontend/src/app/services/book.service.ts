import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Book } from '../models/book.model';

// Kiểu dữ liệu khớp với format JSON trả về từ Backend
interface ApiResponse<T> {
  status: string;
  data: T;
  total?: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/books';

  // Signal lưu danh sách sách (dùng cho các component cần reactive state)
  books = signal<Book[]>([]);

  // ── Lấy tất cả sách và nạp vào signal ──
  loadBooks(): void {
    this.getBooks().subscribe({
      next: (data) => this.books.set(data),
      error: (err) => console.error('Lỗi khi tải danh sách sách:', err)
    });
  }

  // ── GET /api/books ──
  getBooks(): Observable<Book[]> {
    return this.http.get<ApiResponse<Book[]>>(this.apiUrl).pipe(
      map(res => res.data)
    );
  }

  // ── GET /api/books/:id ──
  getBookById(id: number): Observable<Book> {
    return this.http.get<ApiResponse<Book>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  // ── POST /api/books ──
  addBook(book: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.http.post<ApiResponse<Book>>(this.apiUrl, book);
  }

  // ── PUT /api/books/:id ──
  updateBook(id: number, book: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.http.put<ApiResponse<Book>>(`${this.apiUrl}/${id}`, book);
  }

  // ── DELETE /api/books/:id ──
  deleteBook(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
