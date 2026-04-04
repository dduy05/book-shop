import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api'; // <-- Import công cụ thông báo

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './auth-dialog.html',
  styleUrl: './auth-dialog.scss'
})
export class AuthDialogComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService); // <-- Inject vào component

  isLoginMode = true;
  isLoading = false;

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Getter/Setter để bind vào [(visible)] của p-dialog
  get visible(): boolean {
    return this.authService.isLoginDialogOpen();
  }

  set visible(value: boolean) {
    this.authService.isLoginDialogOpen.set(value);
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onSubmit(): void {
    if (this.isLoginMode) {
      if (this.loginForm.invalid) {
        this.loginForm.markAllAsTouched();
        return;
      }
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (res) => {
          this.visible = false;
          this.isLoading = false;
          this.loginForm.reset();
          
          // TUNG HOA: THÔNG BÁO ĐĂNG NHẬP THÀNH CÔNG
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Đăng nhập thành công', 
            detail: `Chào mừng ${res.user?.name || 'bạn'} đã quay trở lại!`,
            life: 3000 
          });
        },
        error: (err) => {
          this.isLoading = false;
          
          // BẮT LỖI: HIỂN THỊ LỖI ĐĂNG NHẬP
          const errorMsg = err.error?.message || 'Email hoặc mật khẩu không chính xác!';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Lỗi đăng nhập', 
            detail: errorMsg,
            life: 4000 
          });
        }
      });
    } else {
      if (this.registerForm.invalid) {
        this.registerForm.markAllAsTouched();
        return;
      }
      this.isLoading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.visible = false;
          this.isLoading = false;
          this.registerForm.reset();
          this.isLoginMode = true; // Trở về form đăng nhập cho lần sau
          
          // THÔNG BÁO TẠO TÀI KHOẢN THÀNH CÔNG
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Tuyệt vời', 
            detail: 'Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.',
            life: 4000 
          });
        },
        error: (err) => {
          this.isLoading = false;

          // BẮT LỖI: TRÙNG EMAIL HOẶC LỖI SERVER
          const errorMsg = err.error?.message || 'Có lỗi xảy ra, email này có thể đã được sử dụng!';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Lỗi đăng ký', 
            detail: errorMsg,
            life: 4000 
          });
        }
      });
    }
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
    this.visible = false;
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: 'Đăng nhập bằng Google thành công!',
      life: 3000 
    });
  }

  // Tiện ích báo lỗi
  isInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}