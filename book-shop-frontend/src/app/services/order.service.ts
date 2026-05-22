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

export interface OrderItem {
  id: number;
  book_id: number;
  quantity: number;
  price: number;
  book_title: string;
  book_author: string;
  book_image?: string;
}

export interface OrderCoupon {
  id: number;
  coupon_id: number;
  code: string;
  discount_amount: number;
  applied_discount_amount?: number;
  coupon_discount_amount?: number;
}

export interface Order {
  id: number;
  user_id: number;
  original_amount?: number;
  discount_amount?: number;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  order_details?: OrderItem[];
  coupons?: OrderCoupon[];
  user_name?: string; // For admin view
  user_email?: string; // For admin view
}

export interface CreateOrderRequest {
  shipping_address: string;
  payment_method: string;
  cart_items: Array<{
    id: number;
    quantity: number;
  }>;
  coupon_codes?: string[];
}

export interface ValidateCouponResponse {
  id: number;
  code: string;
  discount_amount: number;
  remaining_quantity: number;
  min_order_amount: number;
  description?: string;
  applicable_discount: number;
  discounted_total: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/orders';

  // Signal lưu danh sách đơn hàng của user
  userOrders = signal<Order[]>([]);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  // ── Lấy danh sách đơn hàng của user hiện tại ──
  getUserOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── Lấy chi tiết một đơn hàng ──
  getOrderById(id: number): Observable<Order> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── Tạo đơn hàng mới ──
  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, orderData, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── Xác thực mã giảm giá trước khi áp dụng ──
  validateCoupon(code: string, orderTotal: number): Observable<ValidateCouponResponse> {
    return this.http.post<ApiResponse<ValidateCouponResponse>>(`${this.apiUrl.replace('/orders', '/coupons')}/validate`,
      { code, order_total: orderTotal },
      { headers: this.getHeaders() }
    ).pipe(map(res => res.data));
  }

  // ── Cập nhật trạng thái đơn hàng (admin only) ──
  updateOrderStatus(id: number, status: Order['status']): Observable<Order> {
    return this.http.put<ApiResponse<Order>>(`${this.apiUrl}/${id}/status`, { status }, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── Lấy tất cả đơn hàng (admin only) ──
  getAllOrders(): Observable<Order[]> {
    return this.http.get<ApiResponse<Order[]>>(`${this.apiUrl}/admin/all`, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  // ── Load và cập nhật signal ──
  loadUserOrders(): void {
    this.getUserOrders().subscribe({
      next: (data) => this.userOrders.set(data),
      error: (err) => console.error('Lỗi khi tải danh sách đơn hàng:', err)
    });
  }
}