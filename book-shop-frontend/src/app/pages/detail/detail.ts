import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail.html',
  styleUrl: './detail.scss'
})
export class DetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  protected wishlistService = inject(WishlistService);
  
  book = signal<Book | null>(null);
  quantity = signal<number>(1);
  isInWishlist = signal<boolean>(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    if (id) {
      this.bookService.getBooks().subscribe({
        next: (data: Book[]) => {
          const foundBook = data.find(b => b.id === id) || null;
          this.book.set(foundBook);
          if (foundBook) {
            this.isInWishlist.set(this.wishlistService.isInWishlist(foundBook.id));
            this.quantity.set(foundBook.quantity && foundBook.quantity > 0 ? 1 : 0);
          }
        },
        error: (err: any) => console.error('Lỗi khi tải chi tiết sách', err)
      });
    }
  }

  increaseQuantity(): void {
    const book = this.book();
    const available = book?.quantity ?? 0;
    if (available > 0 && this.quantity() < available) {
      this.quantity.update(q => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  setQuantity(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = parseInt(input.value, 10);
    const book = this.book();
    const available = book?.quantity ?? 0;

    if (isNaN(value) || value < 1) {
      value = available > 0 ? 1 : 0;
    }
    if (value > available) {
      value = available;
    }
    this.quantity.set(value);
  }

  onAddToCart(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }

    const available = book.quantity ?? 0;
    const qty = this.quantity();
    const cartItem = this.cartService.cartItems().find(i => i.id === book.id);
    const existingQty = cartItem ? cartItem.quantity : 0;

    if (available <= 0) {
      alert('Sách hiện đang hết hàng.');
      return;
    }

    if (existingQty + qty > available) {
      alert(`Bạn chỉ có thể thêm tối đa ${available - existingQty} cuốn nữa.`);
      return;
    }

    this.cartService.addToCartRemote(book, qty).subscribe({
      next: (added) => {
        if (!added) {
          alert('Không thể thêm vào giỏ hàng do số lượng trong kho không đủ.');
          return;
        }
        const newStock = available - qty;
        this.book.update(current => current ? { ...current, quantity: newStock } : current);
        this.quantity.set(newStock > 0 ? 1 : 0);
        console.log(`Đã thêm ${qty} cuốn "${book.title}" vào giỏ hàng`);
      },
      error: (err) => {
        console.error('Lỗi khi thêm vào giỏ hàng:', err);
        alert('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau.');
      }
    });
  }

  toggleWishlist(book: Book): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }

    if (this.isInWishlist()) {
      this.wishlistService.removeFromWishlist(book.id).subscribe(success => {
        if (success) {
          this.isInWishlist.set(false);
        }
      });
    } else {
      this.wishlistService.addToWishlist(book).subscribe(addedBook => {
        if (addedBook) {
          this.isInWishlist.set(true);
        }
      });
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