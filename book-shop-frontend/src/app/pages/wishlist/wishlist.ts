import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
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
  protected authService = inject(AuthService);

  ngOnInit(): void {
    this.wishlistService.loadWishlist();
  }

  onAddToCart(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }

    const added = this.cartService.addToCart(book, 1);
    if (!added) {
      alert('Không thể thêm vào giỏ hàng: số lượng trong kho không đủ.');
    }
  }

  removeFromWishlist(bookId: number): void {
    this.wishlistService.removeFromWishlist(bookId).subscribe();
  }

  clearAllWishlist(): void {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả sách khỏi danh sách yêu thích?')) {
      this.wishlistService.clearWishlist().subscribe();
    }
  }
}
