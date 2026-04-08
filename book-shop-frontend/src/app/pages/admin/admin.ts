import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

// PrimeNG Services
import { ConfirmationService, MessageService } from 'primeng/api';

// App
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToolbarModule,
    TooltipModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    InputNumberModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  books = signal<Book[]>([]);
  loading = signal(true);

  // Dialog state
  dialogVisible = false;
  isEditMode = false;
  editingBookId: number | null = null;

  // Reactive Form
  bookForm: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(2)]],
    author:      ['', [Validators.required]],
    price:       [0,  [Validators.required, Validators.min(1000)]],
    category:    ['', [Validators.required]],
    image:       [''],
    description: [''],
  });

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading.set(true);
    this.bookService.getBooks().subscribe({
      next: (data) => { this.books.set(data); this.loading.set(false); },
      error: (err) => { console.error(err); this.loading.set(false); }
    });
  }

  // ── Mở dialog Thêm mới ──
  onAddNew(): void {
    this.isEditMode = false;
    this.editingBookId = null;
    this.bookForm.reset({ price: 0 });
    this.dialogVisible = true;
  }

  // ── Mở dialog Sửa ──
  onEdit(book: Book): void {
    this.isEditMode = true;
    this.editingBookId = book.id;
    this.bookForm.patchValue({
      title:       book.title,
      author:      book.author,
      price:       book.price,
      category:    book.category,
      image:       book.image,
      description: book.description,
    });
    this.dialogVisible = true;
  }

  // ── Lưu form ──
  onSave(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    const formValue = this.bookForm.value;

    if (this.isEditMode && this.editingBookId !== null) {
      // Gọi API PUT để cập nhật
      this.bookService.updateBook(this.editingBookId, formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật sách thành công!' });
          this.loadBooks(); // Reload danh sách
          this.dialogVisible = false;
        },
        error: (err) => {
          console.error('Lỗi cập nhật sách:', err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật sách' });
        }
      });
    } else {
      // Gọi API POST để thêm mới
      this.bookService.addBook(formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm sách mới thành công!' });
          this.loadBooks(); // Reload danh sách
          this.dialogVisible = false;
        },
        error: (err) => {
          console.error('Lỗi thêm sách:', err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thêm sách mới' });
        }
      });
    }
  }

  // ── Xóa với ConfirmDialog ──
  onDelete(book: Book): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa sách "<strong>${book.title}</strong>"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Gọi API DELETE
        this.bookService.deleteBook(book.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Đã xóa', detail: `Đã xóa sách "${book.title}"` });
            this.loadBooks(); // Reload danh sách
          },
          error: (err) => {
            console.error('Lỗi xóa sách:', err);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa sách' });
          }
        });
      }
    });
  }

  // ── Hủy dialog ──
  onCancel(): void {
    this.dialogVisible = false;
  }

  // ── Helper kiểm tra lỗi form ──
  isInvalid(field: string): boolean {
    const ctrl = this.bookForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getError(field: string): string {
    const ctrl = this.bookForm.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required'])   return 'Trường này là bắt buộc.';
    if (ctrl.errors['minlength'])  return `Tối thiểu ${ctrl.errors['minlength'].requiredLength} ký tự.`;
    if (ctrl.errors['min'])        return `Giá phải lớn hơn ${ctrl.errors['min'].min.toLocaleString('vi')} VND.`;
    return 'Giá trị không hợp lệ.';
  }
}
