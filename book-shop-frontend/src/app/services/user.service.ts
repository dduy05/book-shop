import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Kiểu dữ liệu khớp với format JSON trả về từ Backend
interface ApiResponse<T> {
  status: string;
  data: T;
  total?: number;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/users';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ── GET /api/users — Lấy tất cả users (admin only)
  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── PUT /api/users/:id/role — Cập nhật role của user (admin only)
  updateUserRole(id: number, role: 'USER' | 'ADMIN'): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}/role`, { role }, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── DELETE /api/users/:id — Xóa user (admin only)
  deleteUser(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}