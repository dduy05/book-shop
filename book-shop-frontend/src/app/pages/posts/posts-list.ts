import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, RouterLink],
  templateUrl: './posts-list.html',
  styleUrl: './posts-list.scss'
})
export class PostsListComponent implements OnInit {
  private postService = inject(PostService);
  protected authService = inject(AuthService);
  posts = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.postService.getPublicPosts().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Lỗi tải danh sách bài viết:', err);
        this.error.set('Không thể tải danh sách bài viết lúc này.');
        this.loading.set(false);
      }
    });
  }
}
