import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  passwordForm!: FormGroup;

  ngOnInit(): void {
    // Khởi tạo form với 3 ô nhập liệu
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator }); // Gắn bộ kiểm tra khớp mật khẩu vào toàn bộ form
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
      console.log('Dữ liệu đổi mật khẩu hợp lệ:', this.passwordForm.value);
      alert('Giao diện bắt lỗi thành công! Chuẩn bị nối API Backend.');
      this.passwordForm.reset();
    } else {
      // Nếu form lỗi mà người dùng cố tình bấm Submit, thì bôi đỏ tất cả các ô
      this.passwordForm.markAllAsTouched();
    }
  }
}