import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> {
  status: string;
  data: T;
  total?: number;
  message?: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_amount: number;
  remaining_quantity: number;
  min_order_amount: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCouponRequest {
  code: string;
  discount_amount: number;
  remaining_quantity: number;
  min_order_amount: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/coupons';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  getAllCoupons(): Observable<Coupon[]> {
    return this.http.get<ApiResponse<Coupon[]>>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  createCoupon(payload: CreateCouponRequest): Observable<Coupon> {
    return this.http.post<ApiResponse<Coupon>>(this.apiUrl, payload, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  updateCoupon(id: number, payload: Partial<CreateCouponRequest>): Observable<Coupon> {
    return this.http.put<ApiResponse<Coupon>>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  deleteCoupon(id: number): Observable<Coupon> {
    return this.http.delete<ApiResponse<Coupon>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }
}
