import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inject HttpClient để kết nối với Node.js Backend
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<User | null>(null);
  isLoginDialogOpen = signal<boolean>(false);

  constructor() {
    // Phục hồi session từ localStorage nếu có (Tránh mất đăng nhập khi F5)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        console.error('Lỗi khi parse user từ localStorage', e);
      }
    }
  }

  // ── GỌI API ĐĂNG NHẬP THẬT ──
  login(email: string, password: string): Observable<any> {
    // Gửi email và password xuống Node.js
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        // Hứng kết quả: Nếu đăng nhập thành công thì lưu vào LocalStorage và cập nhật Signal
        if (res.status === 'success') {
          localStorage.setItem('token', res.token); // Lưu chìa khóa bảo mật
          localStorage.setItem('currentUser', JSON.stringify(res.user)); // Lưu thông tin
          this.currentUser.set(res.user);
        }
      })
    );
  }

  // ── GỌI API ĐĂNG KÝ THẬT ──
  register(info: any): Observable<any> {
    // Truyền thẳng thông tin form xuống Backend để lưu vào PostgreSQL
    return this.http.post<any>(`${this.apiUrl}/register`, info);
  }

  // ── Mock đăng nhập Google (Giữ nguyên như cũ của devops) ──
  loginWithGoogle(): void {
    console.log('Đang đăng nhập bằng Google...');
    const mockUser: User = {
      id: 99,
      name: 'Google User',
      email: 'google.user@gmail.com',
      role: 'USER'
    };
    this.currentUser.set(mockUser);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
  }

  // ── Đổi mật khẩu ──
  changePassword(userId: number, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, {
      userId,
      oldPassword,
      newPassword
    });
  }

  // ── Đăng xuất ──
  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // Quét sạch cả token thật
  }
}