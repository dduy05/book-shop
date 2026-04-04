import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute); // Dùng để đọc URL
  private bookService = inject(BookService); // Gọi API
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  
  // Dùng Signal quản lý dữ liệu cuốn sách (mặc định là null vì chưa có data)
  book = signal<Book | null>(null);

  ngOnInit() {
    // Lấy 'id' từ URL và chuyển thành số (Number)
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (id) {
      this.bookService.getBooks().subscribe({
        next: (data: Book[]) => this.book.set(data.find(b => b.id === id) || null),
        error: (err: any) => console.error('Lỗi khi tải chi tiết sách', err)
      });
    }
  }

  onAddToCart(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }
    this.cartService.addToCart(book);
  }
}