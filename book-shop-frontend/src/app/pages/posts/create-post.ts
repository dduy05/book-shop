import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { PostService } from '../../services/post.service';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, MultiSelectModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.scss'
})
export class CreatePostComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup = this.fb.group({ title: ['', [Validators.required]], content: [''], book_ids: [[]] });
  books: any[] = [];
  editing = false;
  postId: number | null = null;
  errorMessage = '';
  imageFile: File | null = null;
  imagePreview = '';
  existingImage = '';
  imageSource: 'file' | 'url' = 'file';
  imageUrl = '';
  private backendUrl = 'http://localhost:3000';

  private getPreviewUrl(image: string): string {
    if (!image) {
      return '';
    }
    return image.startsWith('http') ? image : `${this.backendUrl}${image}`;
  }

  ngOnInit(): void {
    this.bookService.getBooks().subscribe({ next: (data) => this.books = data, error: (e) => console.error(e) });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.postId = id;
        this.editing = true;
        this.loadPost(id);
      }
    }
  }

  loadPost(id: number): void {
    this.postService.getPostById(id).subscribe({
      next: (post) => {
        if (post.status === 'approved') {
          this.errorMessage = 'Bài viết đã được duyệt, không thể sửa tại đây.';
          return;
        }
        this.existingImage = post.image || '';
        if (post.image) {
          this.imagePreview = post.image.startsWith('http') ? post.image : `${this.backendUrl}${post.image}`;
        } else {
          this.imagePreview = '';
        }
        if (post.image && post.image.startsWith('http')) {
          this.imageSource = 'url';
          this.imageUrl = post.image;
        } else {
          this.imageSource = 'file';
          this.imageUrl = '';
        }
        this.form.patchValue({ title: post.title, content: post.content, book_ids: (post.books || []).map((b: any) => b.id) });
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Không thể tải bài viết để sửa. Hãy thử lại sau.';
      }
    });
  }

  setImageSource(source: 'file' | 'url'): void {
    this.imageSource = source;
    if (source === 'file') {
      this.imageUrl = '';
      if (!this.imageFile) {
        this.imagePreview = this.existingImage;
      }
    } else {
      this.imageFile = null;
      this.imagePreview = this.imageUrl || this.existingImage;
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.imageFile = null;
      this.imagePreview = this.existingImage;
      return;
    }

    this.imageFile = input.files[0];
    this.imageSource = 'file';
    this.existingImage = '';
    this.imagePreview = URL.createObjectURL(this.imageFile);
  }

  onImageUrlInput(): void {
    this.imageSource = 'url';
    this.imageFile = null;
    this.imagePreview = this.imageUrl || this.existingImage;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const formData = new FormData();
    formData.append('title', this.form.get('title')?.value);
    formData.append('content', this.form.get('content')?.value || '');
    (this.form.get('book_ids')?.value || []).forEach((bookId: any) => formData.append('book_ids', bookId));
    if (this.imageFile) {
      formData.append('image', this.imageFile);
    } else if (this.imageSource === 'url' && this.imageUrl) {
      formData.append('imageUrl', this.imageUrl);
    }
    formData.append('imageSource', this.imageSource);

    if (this.editing && this.postId !== null) {
      this.postService.updatePost(this.postId, formData).subscribe({
        next: () => this.router.navigate(['/posts/mine']),
        error: (err) => {
          console.error(err);
          alert('Lỗi khi gửi lại bài');
        }
      });
      return;
    }

    this.postService.createPost(formData).subscribe({
      next: () => this.router.navigate(['/posts/mine']),
      error: (err) => {
        console.error(err);
        alert('Lỗi khi tạo bài');
      }
    });
  }
}
