import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { status: string; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class StatsService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/stats';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }

  getBestSelling(limit = 1): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/best-selling?limit=${limit}`).pipe(map(r => r.data));
  }

  getMonthlyRevenue(months = 12): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/monthly-revenue?months=${months}`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }
}
