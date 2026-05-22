import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
import { PostService } from '../../services/post.service';
import { CouponService, Coupon } from '../../services/coupon.service';

// App
import { BookService } from '../../services/book.service';
import { CategoryService, Category } from '../../services/category.service';
import { UserService, User } from '../../services/user.service';
import { OrderService, Order, OrderItem } from '../../services/order.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private couponService = inject(CouponService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private postService = inject(PostService);
  private router = inject(Router);

  books = signal<Book[]>([]);
  categories = signal<Category[]>([]);
  users = signal<User[]>([]);
  orders = signal<Order[]>([]);
  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  // Thêm tab 'posts' để quản lý bài viết
  activeTab: 'books' | 'users' | 'orders' | 'posts' | 'coupons' = 'books';

  // Posts management
  posts = signal<any[]>([]);
  postRejectDialogVisible = false;
  rejectingPost: any = null;
  rejectReason = '';
  postDetailDialogVisible = false;
  selectedPost: any = null;

  setActiveTab(tab: 'books' | 'users' | 'orders' | 'posts' | 'coupons'): void {
    this.activeTab = tab;
  }

  // Dialog state
  dialogVisible = false;
  isEditMode = false;
  editingBookId: number | null = null;

  // Category dialog state
  categoryDialogVisible = false;
  isEditCategoryMode = false;
  editingCategoryId: number | null = null;

  // Order detail dialog state
  orderDetailDialogVisible = false;
  selectedOrder: Order | null = null;

  // Excel Import state
  importExcelDialogVisible = false;
  selectedExcelFile: File | null = null;
  excelFileName = '';
  importing = false;
  importResult: any = null;

  // Reactive Form
  bookForm: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(2)]],
    author:      ['', [Validators.required]],
    price:       [0,  [Validators.required, Validators.min(1000)]],
    quantity:    [0,  [Validators.required, Validators.min(0)]],
    category_id: [null, [Validators.required]],
    imageSource: ['upload'],
    imageUrl:    [''],
    image:       [''],
    description: [''],
  });

  selectedBookImageFile: File | null = null;
  bookImagePreview: string | null = null;

  // Category Form
  categoryForm: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
  });

  // Coupon Form
  couponForm: FormGroup = this.fb.group({
    code: ['',[Validators.required, Validators.minLength(2)]],
    discount_amount: [0, [Validators.required, Validators.min(0)]],
    remaining_quantity: [0, [Validators.required, Validators.min(0)]],
    min_order_amount: [0, [Validators.required, Validators.min(0)]],
    description: ['']
  });

  selectedCouponId: number | null = null;
  couponDialogVisible = false;
  isEditCouponMode = false;

  // Dropdown options
  userRoleOptions = [
    { label: 'User', value: 'USER' },
    { label: 'Admin', value: 'ADMIN' }
  ];

  orderStatusOptions = [
    { label: 'Chờ xác nhận', value: 'PENDING' },
    { label: 'Đã xác nhận', value: 'CONFIRMED' },
    { label: 'Đang giao', value: 'SHIPPED' },
    { label: 'Đã giao', value: 'DELIVERED' }
  ];

  ngOnInit() {
    this.loadBooks();
    this.loadCategories();
    this.loadUsers();
    this.loadOrders();
    this.loadCoupons();
    this.loadPosts();
  }

  // ── Posts ──
  loadPosts(): void {
    this.postService.getAllAdmin().subscribe({ next: (data) => this.posts.set(data), error: (err) => console.error('Lỗi tải posts:', err) });
  }

  onApprovePost(post: any): void {
    this.postService.approvePost(post.id).subscribe({ next: () => this.loadPosts(), error: (e) => { console.error(e); } });
  }

  onOpenReject(post: any): void {
    this.rejectingPost = post;
    this.rejectReason = '';
    this.postRejectDialogVisible = true;
  }

  onRejectPostConfirm(): void {
    if (!this.rejectReason) { alert('Cần nhập lý do từ chối'); return; }
    this.postService.rejectPost(this.rejectingPost.id, this.rejectReason).subscribe({ next: () => { this.postRejectDialogVisible = false; this.loadPosts(); }, error: (e) => console.error(e) });
  }

  onDeletePost(post: any): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa bài viết "${post.title}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.postService.deletePost(post.id).subscribe({ next: () => this.loadPosts(), error: (e) => console.error(e) });
      }
    });
  }

  onViewPost(post: any): void {
    if (post.status !== 'approved') {
      this.selectedPost = post;
      this.postDetailDialogVisible = true;
      return;
    }

    this.router.navigate(['/posts', post.id]);
  }

  closePostDetail(): void {
    this.postDetailDialogVisible = false;
    this.selectedPost = null;
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

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch ((status || '').toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warn';
      default: return 'info';
    }
  }

  loadBooks(): void {
    this.loading.set(true);
    this.bookService.getBooks().subscribe({
      next: (data) => { this.books.set(data); this.loading.set(false); },
      error: (err) => { console.error(err); this.loading.set(false); }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Lỗi khi tải categories:', err)
    });
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Lỗi khi tải users:', err)
    });
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (data) => this.orders.set(data.map(order => ({
        ...order,
        status: (typeof order.status === 'string' ? order.status.toUpperCase() : order.status) as Order['status']
      })) ),
      error: (err) => console.error('Lỗi khi tải orders:', err)
    });
  }

  loadCoupons(): void {
    this.couponService.getAllCoupons().subscribe({
      next: (data) => this.coupons.set(data),
      error: (err) => console.error('Lỗi khi tải coupons:', err)
    });
  }

  onAddCoupon(): void {
    this.isEditCouponMode = false;
    this.selectedCouponId = null;
    this.couponForm.reset({ code: '', discount_amount: 0, remaining_quantity: 0, min_order_amount: 0, description: '' });
    this.couponDialogVisible = true;
  }

  onEditCoupon(coupon: Coupon): void {
    this.isEditCouponMode = true;
    this.selectedCouponId = coupon.id;
    this.couponForm.patchValue({
      code: coupon.code,
      discount_amount: coupon.discount_amount,
      remaining_quantity: coupon.remaining_quantity,
      min_order_amount: coupon.min_order_amount,
      description: coupon.description || ''
    });
    this.couponDialogVisible = true;
  }

  onSaveCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    const payload = this.couponForm.value;
    const action = this.isEditCouponMode && this.selectedCouponId !== null
      ? this.couponService.updateCoupon(this.selectedCouponId, payload)
      : this.couponService.createCoupon(payload);

    action.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: this.isEditCouponMode ? 'Cập nhật mã giảm giá thành công!' : 'Thêm mã giảm giá mới thành công!' });
        this.loadCoupons();
        this.couponDialogVisible = false;
      },
      error: (err) => {
        console.error('Lỗi lưu coupon:', err);
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.message || 'Không thể lưu mã giảm giá' });
      }
    });
  }

  onDeleteCoupon(coupon: Coupon): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa mã giảm giá "<strong>${coupon.code}</strong>"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.couponService.deleteCoupon(coupon.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Đã xóa', detail: `Đã xóa mã ${coupon.code}` });
            this.loadCoupons();
          },
          error: (err) => {
            console.error('Lỗi xóa coupon:', err);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa mã giảm giá' });
          }
        });
      }
    });
  }

  onCancelCoupon(): void {
    this.couponDialogVisible = false;
  }

  // ── Mở dialog Thêm mới ──
  onAddNew(): void {
    this.isEditMode = false;
    this.editingBookId = null;
    this.selectedBookImageFile = null;
    this.bookImagePreview = null;
    this.bookForm.reset({
      title: '',
      author: '',
      price: 0,
      quantity: 0,
      category_id: null,
      imageSource: 'upload',
      imageUrl: '',
      image: '',
      description: ''
    });
    this.dialogVisible = true;
  }

  // ── Mở dialog Sửa ──
  onEdit(book: Book): void {
    this.isEditMode = true;
    this.editingBookId = book.id;
    this.selectedBookImageFile = null;
    const currentImage = book.image || '';
    this.bookImagePreview = this.getImageUrl(currentImage);
    this.bookForm.patchValue({
      title:       book.title,
      author:      book.author,
      price:       book.price,
      quantity:    book.quantity ?? 0,
      category_id: book.category_id,
      imageSource: currentImage ? 'url' : 'upload',
      imageUrl:    currentImage,
      image:       currentImage,
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
    const imageSource = formValue.imageSource;
    const imageUrl = formValue.imageUrl?.trim();

    const hasUploadedImage = imageSource === 'upload' && !!this.selectedBookImageFile;

    let body: Partial<Book> | FormData;
    if (hasUploadedImage) {
      body = new FormData();
      Object.entries(formValue).forEach(([key, value]) => {
        if (key !== 'image' && key !== 'imageUrl' && key !== 'imageSource') {
          (body as FormData).append(key, String(value ?? ''));
        }
      });
      (body as FormData).append('image', this.selectedBookImageFile as File);
    } else {
      body = {
        ...formValue,
        image: imageSource === 'url' ? imageUrl : formValue.image,
      };
    }

    if (this.isEditMode && this.editingBookId !== null) {
      // Gọi API PUT để cập nhật
      this.bookService.updateBook(this.editingBookId, body).subscribe({
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
      this.bookService.addBook(body).subscribe({
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
    this.selectedBookImageFile = null;
    this.bookImagePreview = null;
  }

  // ── Excel Import Methods ──
  onOpenImportExcelDialog(): void {
    this.selectedExcelFile = null;
    this.excelFileName = '';
    this.importResult = null;
    this.importExcelDialogVisible = true;
  }

  onExcelFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedExcelFile = null;
      this.excelFileName = '';
      return;
    }
    this.selectedExcelFile = input.files[0];
    this.excelFileName = this.selectedExcelFile.name;
    this.importResult = null;
  }

  onUploadExcel(): void {
    if (!this.selectedExcelFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Chưa chọn tệp',
        detail: 'Vui lòng chọn một tệp Excel (.xlsx hoặc .xls) trước.'
      });
      return;
    }

    this.importing = true;
    this.importResult = null;

    this.bookService.importBooksExcel(this.selectedExcelFile).subscribe({
      next: (res) => {
        this.importing = false;
        this.importResult = res.data;
        
        if (res.data.successCount > 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã nhập thành công ${res.data.successCount} sách từ Excel!`
          });
          this.loadBooks();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Thất bại',
            detail: 'Không có sách nào được nhập thành công. Vui lòng kiểm tra lỗi chi tiết.'
          });
        }
      },
      error: (err) => {
        this.importing = false;
        console.error('Lỗi khi tải tệp Excel lên:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi hệ thống',
          detail: err.error?.message || 'Không thể tải tệp Excel lên xử lý.'
        });
      }
    });
  }

  onDownloadTemplate(): void {
    window.open('http://localhost:3000/templates/book_import_template.xlsx', '_blank');
  }

  onBookImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedBookImageFile = null;
      this.bookImagePreview = this.bookForm.value.imageUrl || null;
      return;
    }

    this.selectedBookImageFile = input.files[0];
    this.bookForm.patchValue({ imageSource: 'upload', imageUrl: '' });
    this.bookImagePreview = URL.createObjectURL(this.selectedBookImageFile);
  }

  onImageUrlChange(value: string): void {
    this.bookForm.patchValue({ imageSource: 'url', imageUrl: value });
    this.selectedBookImageFile = null;
    this.bookImagePreview = value || null;
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
    if (ctrl.errors['min']) {
      if (field === 'price') {
        return `Giá phải lớn hơn ${ctrl.errors['min'].min.toLocaleString('vi')} VND.`;
      }
      if (field === 'quantity') {
        return 'Số lượng phải lớn hơn hoặc bằng 0.';
      }
      return 'Giá trị phải hợp lệ.';
    }
    return 'Giá trị không hợp lệ.';
  }

  // ── Category Methods ──

  // ── Mở dialog Thêm category mới ──
  onAddCategory(): void {
    this.isEditCategoryMode = false;
    this.editingCategoryId = null;
    this.categoryForm.reset();
    this.categoryDialogVisible = true;
  }

  // ── Mở dialog Sửa category ──
  onEditCategory(category: Category): void {
    this.isEditCategoryMode = true;
    this.editingCategoryId = category.id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
    });
    this.categoryDialogVisible = true;
  }

  // ── Lưu category form ──
  onSaveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;

    if (this.isEditCategoryMode && this.editingCategoryId !== null) {
      // Cập nhật category
      this.categoryService.updateCategory(this.editingCategoryId, formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật thể loại thành công!' });
          this.loadCategories();
          this.categoryDialogVisible = false;
        },
        error: (err) => {
          console.error('Lỗi cập nhật category:', err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể cập nhật thể loại' });
        }
      });
    } else {
      // Thêm category mới
      this.categoryService.addCategory(formValue).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm thể loại mới thành công!' });
          this.loadCategories();
          this.categoryDialogVisible = false;
        },
        error: (err) => {
          console.error('Lỗi thêm category:', err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể thêm thể loại mới' });
        }
      });
    }
  }

  // ── Xóa category ──
  onDeleteCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa thể loại "<strong>${category.name}</strong>"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'warn', summary: 'Đã xóa', detail: `Đã xóa thể loại "${category.name}"` });
            this.loadCategories();
          },
          error: (err) => {
            console.error('Lỗi xóa category:', err);
            this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa thể loại' });
          }
        });
      }
    });
  }

  // ── Hủy category dialog ──
  onCancelCategory(): void {
    this.categoryDialogVisible = false;
  }

  // ── Helper kiểm tra lỗi category form ──
  isInvalidCategory(field: string): boolean {
    const ctrl = this.categoryForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getCategoryError(field: string): string {
    const ctrl = this.categoryForm.get(field);
    if (!ctrl || !ctrl.errors) return '';
    if (ctrl.errors['required'])   return 'Trường này là bắt buộc.';
    if (ctrl.errors['minlength'])  return `Tối thiểu ${ctrl.errors['minlength'].requiredLength} ký tự.`;
    return 'Giá trị không hợp lệ.';
  }

  // ── User Management Methods ──

  onUpdateUserRole(user: User): void {
    const newRole = user.role === 'USER' ? 'ADMIN' : 'USER';
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn thay đổi role của <strong>${user.name}</strong> thành <strong>${newRole}</strong>?`,
      header: 'Xác nhận thay đổi role',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Hủy',
      accept: () => {
        this.userService.updateUserRole(user.id, newRole).subscribe({
          next: (updatedUser) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã cập nhật role của ${updatedUser.name}`
            });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Lỗi cập nhật role:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể cập nhật role người dùng'
            });
          }
        });
      }
    });
  }

  onDeleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa người dùng "<strong>${user.name}</strong>"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Đã xóa',
              detail: `Đã xóa người dùng "${user.name}"`
            });
            this.loadUsers();
          },
          error: (err) => {
            console.error('Lỗi xóa user:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa người dùng'
            });
          }
        });
      }
    });
  }

  // ── Order Management Methods ──

  onUpdateOrderStatus(order: Order): void {
    // Tạo dropdown để chọn status mới
    const currentStatus = order.status;
    // Logic này sẽ được xử lý trong template với dropdown
  }

  updateOrderStatus(order: Order, newStatus: Order['status']): void {
    if (newStatus === order.status) {
      return;
    }

    const oldStatus = order.status;

    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (updatedOrder) => {
        // Cập nhật status trong order object
        order.status = newStatus as Order['status'];
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: `Đã cập nhật trạng thái đơn hàng #${updatedOrder.id}`
        });
      },
      error: (err) => {
        console.error('Lỗi cập nhật order status:', err);
        // Revert lại giá trị cũ nếu lỗi
        order.status = oldStatus;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật trạng thái đơn hàng'
        });
      }
    });
  }

  onCancelOrder(order: Order): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn hủy đơn hàng #<strong>${order.id}</strong>?`,
      header: 'Xác nhận hủy đơn hàng',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Hủy đơn',
      rejectLabel: 'Không hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.updateOrderStatus(order, 'CANCELLED');
      }
    });
  }

  onViewOrder(order: Order): void {
    this.selectedOrder = null;
    this.orderDetailDialogVisible = true;

    this.orderService.getOrderById(order.id).subscribe({
      next: (data) => {
        this.selectedOrder = {
          ...data,
          status: (typeof data.status === 'string' ? data.status.toUpperCase() : data.status) as Order['status']
        };
      },
      error: (err) => {
        console.error('Lỗi tải chi tiết đơn hàng:', err);
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết đơn hàng' });
      }
    });
  }

  getOrderItems(order: Order | null): OrderItem[] {
    return order ? (order.items ?? order.order_details ?? []) : [];
  }

  getOrderCoupons(order: Order | null) {
    return order?.coupons ?? [];
  }

  // ── Helper Methods ──

  getUserRoleSeverity(role: string): 'success' | 'info' {
    return role === 'ADMIN' ? 'success' : 'info';
  }

  getOrderStatusSeverity(status: string): 'info' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'PENDING': return 'info';
      case 'CONFIRMED': return 'success';
      case 'SHIPPED': return 'warning';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'info';
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' VND';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
}
