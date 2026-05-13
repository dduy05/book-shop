import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { OrderService, Order, OrderItem } from '../../services/order.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule],
  providers: [MessageService, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  fb = inject(FormBuilder);
  messageService = inject(MessageService);
  orderService = inject(OrderService);

  passwordForm!: FormGroup;
  isLoading = false;
  activeTab = 'password';
  orders = signal<Order[]>([]);

  ngOnInit(): void {
    // Khởi tạo form với 3 ô nhập liệu
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // Gắn bộ kiểm tra khớp mật khẩu vào toàn bộ form

    // Load orders
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getUserOrders().subscribe({
      next: (data) => this.orders.set(data),
      error: (err) => {
        console.error('Lỗi khi tải đơn hàng:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách đơn hàng'
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Chờ xử lý',
      'CONFIRMED': 'Đã xác nhận',
      'SHIPPED': 'Đang giao',
      'DELIVERED': 'Đã giao',
      'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  getOrderItems(order: Order): OrderItem[] {
    return order.items || order.order_details || [];
  }

  // Hàm tự viết: Kiểm tra mật khẩu mới và xác nhận có giống nhau không
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      // Nếu có lỗi, gán lỗi 'mismatch' cho ô confirmPassword
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      const user = this.authService.currentUser();
      if (!user) {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Vui lòng đăng nhập lại',
          life: 3000
        });
        return;
      }

      this.isLoading = true;
      const { oldPassword, newPassword } = this.passwordForm.value;

      this.authService.changePassword(user.id, oldPassword, newPassword).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đổi mật khẩu thành công',
            life: 3000
          });
          this.passwordForm.reset();
        },
        error: (err) => {
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Đổi mật khẩu thất bại';
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: errorMsg,
            life: 4000
          });
        }
      });
    } else {
      this.passwordForm.markAllAsTouched();
    }
  }
}