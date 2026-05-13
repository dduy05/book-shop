import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ToastModule, DialogModule],
  providers: [MessageService],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent {
  protected cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private bookService = inject(BookService);

  checkoutDialogVisible = signal(false);
  checkoutForm!: FormGroup;
  isProcessingOrder = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      shipping_address: ['', Validators.required],
      payment_method: ['COD', Validators.required]
    });
  }

  removeFromCart(bookId: number): void {
    const removedItem = this.cartService.removeFromCart(bookId);
    if (removedItem) {
      // Hoàn lại số lượng sách trong database
      this.bookService.updateBookQuantity(removedItem.id, removedItem.quantity, true).subscribe({
        next: () => {
          // Cập nhật quantity trong books signal nếu cần
          // Có thể cần refresh books list hoặc update local
        },
        error: (err) => {
          console.error('Lỗi khi hoàn lại số lượng sách:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể hoàn lại số lượng sách'
          });
        }
      });
    }
  }

  clearCart(): void {
    const clearedItems = this.cartService.clearCart();
    // Hoàn lại số lượng cho tất cả items
    clearedItems.forEach(item => {
      this.bookService.updateBookQuantity(item.id, item.quantity, true).subscribe({
        next: () => {},
        error: (err) => {
          console.error('Lỗi khi hoàn lại số lượng sách:', err);
        }
      });
    });
  }

  openCheckoutDialog(): void {
    if (!this.authService.currentUser()) {
      this.authService.isLoginDialogOpen.set(true);
      return;
    }

    if (this.cartService.cartItems().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giỏ hàng trống'
      });
      return;
    }

    this.checkoutDialogVisible.set(true);
  }

  closeCheckoutDialog(): void {
    this.checkoutDialogVisible.set(false);
    this.checkoutForm.reset({ payment_method: 'COD' });
  }

  submitOrder(): void {
    if (this.checkoutForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng điền đầy đủ thông tin'
      });
      return;
    }

    this.isProcessingOrder = true;
    const formValue = this.checkoutForm.value;

    const cartItems = this.cartService.cartItems().map(item => ({
      id: item.id,
      quantity: item.quantity
    }));

    this.orderService.createOrder({
      shipping_address: formValue.shipping_address,
      payment_method: formValue.payment_method,
      cart_items: cartItems
    }).subscribe({
      next: (order) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đặt hàng thành công!'
        });
        this.cartService.clearCart();
        this.closeCheckoutDialog();
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.error('Order error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: err.error?.message || 'Có lỗi xảy ra khi đặt hàng'
        });
      },
      complete: () => {
        this.isProcessingOrder = false;
      }
    });
  }
}
