import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';
import { CategoryService, Category } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';



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
    this.bookService.updateBookQuantity(book.id, newStock).subscribe({
      next: () => {
        const added = this.cartService.addToCart(book, 1);
        if (!added) {
          alert('Không thể thêm vào giỏ hàng: số lượng trong kho không đủ.');
          return;
        }
        this.books.update(items => items.map(item =>
          item.id === book.id ? { ...item, quantity: newStock } : item
        ));
      },
      error: (err) => {
        console.error('Lỗi cập nhật tồn kho:', err);
        alert('Không thể cập nhật tồn kho. Vui lòng thử lại sau.');
      }
    });
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
}