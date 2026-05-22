import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { CartService } from '../../services/cart.service';
import { OrderService, ValidateCouponResponse } from '../../services/order.service';
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
  appliedCoupons = signal<ValidateCouponResponse[]>([]);
  isProcessingOrder = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      shipping_address: ['', Validators.required],
      payment_method: ['COD', Validators.required],
      coupon_code: ['']
    });
  }

  removeFromCart(bookId: number): void {
    this.cartService.removeFromCartRemote(bookId).subscribe({
      next: (removed) => {
        if (removed) {
          this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Đã xóa khỏi giỏ hàng' });
        } else {
          this.messageService.add({ severity: 'warn', summary: 'Chú ý', detail: 'Không tìm thấy mục trong giỏ hàng' });
        }
      },
      error: (err) => {
        console.error('Lỗi khi xóa khỏi giỏ hàng:', err);
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa khỏi giỏ hàng' });
      }
    });
  }

  clearCart(): void {
    this.cartService.clearCartRemote().subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Đã xóa toàn bộ giỏ hàng' });
      },
      error: (err) => {
        console.error('Lỗi khi xóa toàn bộ giỏ hàng:', err);
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa giỏ hàng' });
      }
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
    this.checkoutForm.reset({ payment_method: 'COD', coupon_code: '' });
    this.appliedCoupons.set([]);
  }

  getDiscountAmount(): number {
    return this.appliedCoupons().reduce((sum, coupon) => sum + coupon.applicable_discount, 0);
  }

  getFinalTotal(): number {
    return Math.max(0, this.cartService.totalPrice() - this.getDiscountAmount());
  }

  applyCoupon(): void {
    const code = this.checkoutForm.value.coupon_code?.trim();
    const orderTotal = this.cartService.totalPrice();

    if (!code) {
      this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập mã giảm giá' });
      return;
    }

    if (this.appliedCoupons().some(coupon => coupon.code === code.toUpperCase())) {
      this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Mã giảm giá này đã được áp dụng' });
      return;
    }

    this.orderService.validateCoupon(code, orderTotal).subscribe({
      next: (data) => {
        this.appliedCoupons.update((current) => [...current, data]);
        this.messageService.add({ severity: 'success', summary: 'Đã áp dụng', detail: `Mã ${data.code} được áp dụng thành công` });
        this.checkoutForm.patchValue({ coupon_code: '' });
      },
      error: (err) => {
        console.error('Coupon validation error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi mã giảm giá',
          detail: err.error?.message || 'Không thể áp dụng mã giảm giá'
        });
      }
    });
  }

  removeAppliedCoupon(code: string): void {
    this.appliedCoupons.update((current) => current.filter((coupon) => coupon.code !== code));
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
      cart_items: cartItems,
      coupon_codes: this.appliedCoupons().map(coupon => coupon.code)
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
