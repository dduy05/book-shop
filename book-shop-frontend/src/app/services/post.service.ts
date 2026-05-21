import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ApiResponse<T> { status: string; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/posts';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }

  createPost(body: FormData): Observable<any> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, body, { headers: this.getFormDataHeaders() }).pipe(map(r => r.data));
  }

  getMyPosts(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/mine`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }

  getPublicPosts(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(this.apiUrl).pipe(map(r => r.data));
  }

  getPostById(id: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }

  getAdminPostById(id: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/admin/${id}`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }

  updatePost(id: number, body: FormData) {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, body, { headers: this.getFormDataHeaders() }).pipe(map(r => r.data));
  }

  deleteMyPost(id: number) {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }

  // Admin
  getAllAdmin(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/admin/all`, { headers: this.getHeaders() }).pipe(map(r => r.data));
  }

  approvePost(id: number) { return this.http.put<ApiResponse<any>>(`${this.apiUrl}/admin/${id}/approve`, {}, { headers: this.getHeaders() }).pipe(map(r => r.data)); }
  rejectPost(id: number, reason: string) { return this.http.put<ApiResponse<any>>(`${this.apiUrl}/admin/${id}/reject`, { reason }, { headers: this.getHeaders() }).pipe(map(r => r.data)); }
  deletePost(id: number) { return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/admin/${id}`, { headers: this.getHeaders() }).pipe(map(r => r.data)); }
}
