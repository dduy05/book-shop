import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PostService } from '../../services/post.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.scss'
})
export class PostDetailComponent implements OnInit {
  private postService = inject(PostService);
  private route = inject(ActivatedRoute);
  post = signal<any>(null);
  error = signal('');
  loading = signal(true);
  private backendUrl = 'http://localhost:3000';

  getImageUrl(image: string | null): string {
    if (!image) {
      return '';
    }
    return image.startsWith('http') ? image : `${this.backendUrl}${image}`;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('ID bài viết không hợp lệ.');
      this.loading.set(false);
      return;
    }

    this.postService.getPostById(id).subscribe({
      next: (data) => {
        this.post.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải chi tiết bài viết:', err);
        this.error.set('Không tìm thấy bài viết hoặc bài viết chưa được duyệt.');
        this.loading.set(false);
      }
    });
  }
}
