import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router'; // <-- Thêm Router để điều hướng
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog';
import { MessageService } from 'primeng/api'; // <-- Thêm MessageService để gọi Toast

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AuthDialogComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  protected cartService = inject(CartService);
  protected authService = inject(AuthService);
  
  // Inject thêm 2 công cụ mới
  private router = inject(Router);
  private messageService = inject(MessageService);

  openLoginDialog(): void {
    this.authService.isLoginDialogOpen.set(true);
  }

  logout(): void {
    // 1. Quét sạch token và dữ liệu phiên làm việc
    this.authService.logout();

    // 2. Đá văng người dùng về trang chủ (nếu họ đang ở trang Profile hay Giỏ hàng)
    this.router.navigate(['/']);

    // 3. Hiện thông báo pop-up nhẹ nhàng ở góc
    this.messageService.add({
      severity: 'info',
      summary: 'Đã đăng xuất',
      detail: 'Hẹn gặp lại bạn tại cửa hàng sách!',
      life: 3000 // Tự tắt sau 3 giây
    });
  }
}