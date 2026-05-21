import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-mine-posts',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, InputTextModule, RouterModule],
  templateUrl: './mine-posts.html',
  styleUrl: './mine-posts.scss'
})
export class MinePostsComponent implements OnInit {
  private postService = inject(PostService);
  private bookService = inject(BookService);
  private router = inject(Router);

  posts = signal<any[]>([]);
  books: any[] = [];

  ngOnInit(): void {
    this.load();
    this.bookService.getBooks().subscribe({ next: (d) => this.books = d, error: (e) => console.error(e) });
  }

  load(): void {
    this.postService.getMyPosts().subscribe({ next: (d) => this.posts.set(d), error: (e) => console.error(e) });
  }

  onEdit(post: any): void {
    this.router.navigate(['/posts/create', post.id]);
  }

  onDelete(post: any): void {
    if (!window.confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"?`)) {
      return;
    }
    this.postService.deleteMyPost(post.id).subscribe({
      next: () => this.load(),
      error: (e) => { console.error(e); alert('Xóa bài viết thất bại'); }
    });
  }
}
