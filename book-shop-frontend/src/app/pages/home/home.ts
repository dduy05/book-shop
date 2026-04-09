import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';
import { CategoryService, Category } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';

export interface Tab {
  index: number;
  label: string;
  icon: string;
  visible: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);

  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<number | null>(null);

  // ── Tab state ──────────────────────────────────────────
  tabs = signal<Tab[]>([
    { index: 0, label: 'Tổng quan',         icon: 'pi pi-home',        visible: true },
    { index: 1, label: 'Sách mới',          icon: 'pi pi-star',        visible: true },
    { index: 2, label: 'Bán chạy',          icon: 'pi pi-chart-bar',   visible: true },
    { index: 3, label: 'Theo thể loại',     icon: 'pi pi-bookmark',    visible: true },
  ]);

  activeTabIndex = signal(0);

  // Tabs còn hiển thị (chưa bị đóng)
  visibleTabs = computed(() => this.tabs().filter(t => t.visible));

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
  }

  selectTab(index: number): void {
    this.activeTabIndex.set(index);
  }

  closeTab(index: number, event: Event): void {
    event.stopPropagation(); // Tránh trigger selectTab

    // Nếu đang đóng tab active → chuyển sang tab trước đó
    if (this.activeTabIndex() === index) {
      const visible = this.visibleTabs();
      const pos = visible.findIndex(t => t.index === index);
      const next = visible[pos - 1] ?? visible[pos + 1];
      if (next) this.activeTabIndex.set(next.index);
    }

    this.tabs.update(tabs =>
      tabs.map(t => t.index === index ? { ...t, visible: false } : t)
    );
  }

  onAddToCart(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }
    this.cartService.addToCart(book);
  }

  // Filter books theo category
  getFilteredBooks(): Book[] {
    const categoryId = this.selectedCategoryId();
    if (!categoryId) return this.books();
    return this.books().filter(book => book.category_id === categoryId);
  }

  // Chọn category để filter
  selectCategory(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const categoryId = target.value ? +target.value : null;
    this.selectedCategoryId.set(categoryId);
  }

  // Trả về true nếu tab đang active
  isActive(index: number): boolean {
    return this.activeTabIndex() === index;
  }
}