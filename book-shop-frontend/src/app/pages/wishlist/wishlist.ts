import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class WishlistComponent implements OnInit {
  protected wishlistService = inject(WishlistService);
  private cartService = inject(CartService);
  private bookService = inject(BookService);
  protected authService = inject(AuthService);

  ngOnInit(): void {
    this.wishlistService.loadWishlist();
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
        }
      },
      error: (err) => {
        console.error('Lỗi cập nhật tồn kho:', err);
        alert('Không thể cập nhật tồn kho. Vui lòng thử lại sau.');
      }
    });
  }

  removeFromWishlist(bookId: number): void {
    this.wishlistService.removeFromWishlist(bookId).subscribe();
  }

  clearAllWishlist(): void {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả sách khỏi danh sách yêu thích?')) {
      this.wishlistService.clearWishlist().subscribe();
    }
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
}
