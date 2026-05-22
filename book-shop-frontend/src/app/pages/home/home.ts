import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { BookService } from '../../services/book.service';
import { StatsService } from '../../services/stats.service';
import { CategoryService, Category } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';
import { ChatbotComponent } from '../chatbot/chatbot';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DialogModule, ChatbotComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private bookService = inject(BookService);
  private statsService = inject(StatsService);
  private categoryService = inject(CategoryService);
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);

  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<number | null>(null);
  searchTerm = signal<string>('');
  isChatbotDialogOpen = signal<boolean>(false);

  // ── Methods ───────────────────────────────────────────
  ngOnInit(): void {
    this.bookService.getBooks().subscribe({
      next: (data: Book[]) => this.books.set(data),
      error: (err) => console.error('Lỗi khi gọi API:', err)
    });

    this.categoryService.getCategories().subscribe({
      next: (data: Category[]) => this.categories.set(data),
      error: (err) => console.error('Lỗi khi tải categories:', err)
    });

    this.statsService.getBestSelling(5).subscribe({
      next: (rows) => {
        if (rows) {
          const books = rows.map((b) => ({ ...b, sold_count: Number(b.sold_count || 0) }));
          this.bestSellers.set(books);
          this.currentSlide.set(0);
          this.startAutoCycle();
        }
      },
      error: (e) => {
        console.error('Lỗi khi tải sách bán chạy:', e);
      }
    });
  }



  onAddToCart(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }

    const available = book.quantity ?? 0;
    const cartItem = this.cartService.cartItems().find(i => i.id === book.id);
    const existingQty = cartItem ? cartItem.quantity : 0;

    if (available <= 0 || existingQty + 1 > available) {
      alert('Không thể thêm vào giỏ hàng: số lượng trong kho không đủ.');
      return;
    }

    const newStock = available - 1;
    this.cartService.addToCartRemote(book, 1).subscribe({
      next: (added) => {
        if (!added) {
          alert('Không thể thêm vào giỏ hàng: số lượng trong kho không đủ.');
          return;
        }
        const newStock = available - 1;
        this.books.update(items => items.map(item =>
          item.id === book.id ? { ...item, quantity: newStock } : item
        ));
      },
      error: (err) => {
        console.error('Lỗi khi thêm vào giỏ hàng:', err);
        alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau.');
      }
    });
  }

  // Filter books theo category và search term
  getFilteredBooks(): Book[] {
    const categoryId = this.selectedCategoryId();
    const term = this.searchTerm().toLowerCase().trim();
    let filtered = this.books();

    if (categoryId) {
      filtered = filtered.filter(book => book.category_id === categoryId);
    }

    if (term) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  // Mở dialog chatbot
  openChatbot(): void {
    this.isChatbotDialogOpen.set(true);
  }

  // Đóng dialog chatbot
  closeChatbot(): void {
    this.isChatbotDialogOpen.set(false);
  }

  // Chọn category để filter
  selectCategory(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const categoryId = target.value ? +target.value : null;
    this.selectedCategoryId.set(categoryId);
  }

  getImageUrl(image: string | null | undefined): string {
    if (!image) {
      return '';
    }
    if (image.startsWith('http')) {
      return image;
    }
    return image.startsWith('/') ? `http://localhost:3000${image}` : `http://localhost:3000/${image}`;
  }

  bestSellers = signal<any[]>([]);
  currentSlide = signal(0);
  private sliderIntervalId: ReturnType<typeof window.setInterval> | null = null;

  startAutoCycle(): void {
    this.stopAutoCycle();
    if (this.bestSellers().length <= 1) {
      return;
    }
    this.sliderIntervalId = window.setInterval(() => this.nextSlide(), 5000);
  }

  stopAutoCycle(): void {
    if (this.sliderIntervalId !== null) {
      clearInterval(this.sliderIntervalId);
      this.sliderIntervalId = null;
    }
  }

  nextSlide(): void {
    const count = this.bestSellers().length;
    if (!count) {
      return;
    }
    this.currentSlide.set((this.currentSlide() + 1) % count);
    this.startAutoCycle();
  }

  prevSlide(): void {
    const count = this.bestSellers().length;
    if (!count) {
      return;
    }
    this.currentSlide.set((this.currentSlide() - 1 + count) % count);
    this.startAutoCycle();
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.startAutoCycle();
  }

  ngOnDestroy(): void {
    this.stopAutoCycle();
  }
}