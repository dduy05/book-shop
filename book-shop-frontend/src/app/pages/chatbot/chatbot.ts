import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface ChatMessage {
  role: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})
export class ChatbotComponent implements OnInit {
  private http = inject(HttpClient);

  messages = signal<ChatMessage[]>([]);
  userInput = signal<string>('');
  isLoading = signal<boolean>(false);
  chatbotUrl = 'http://localhost:3001/api/chat';

  ngOnInit(): void {
    // Khởi tạo tin nhắn chào mừng
    this.messages.set([
      {
        role: 'bot',
        message: '👋 Xin chào! Tôi là trợ lý tư vấn sách thông minh. Bạn cần giúp tìm cuốn sách nào không?',
        timestamp: new Date()
      }
    ]);
  }

  sendMessage(): void {
    const input = this.userInput().trim();
    if (!input) return;

    // Thêm tin nhắn từ user
    this.messages.update(msgs => [
      ...msgs,
      { role: 'user', message: input, timestamp: new Date() }
    ]);

    this.userInput.set('');
    this.isLoading.set(true);

    // Gọi API chatbot
    this.http.post<{ reply: string }>(this.chatbotUrl, { message: input }).subscribe({
      next: (res) => {
        this.messages.update(msgs => [
          ...msgs,
          { role: 'bot', message: res.reply, timestamp: new Date() }
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Chatbot error:', err);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'bot', message: '❌ Xin lỗi, tôi gặp lỗi. Vui lòng thử lại sau.', timestamp: new Date() }
        ]);
        this.isLoading.set(false);
      }
    });
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  clearChat(): void {
    this.messages.set([
      {
        role: 'bot',
        message: '👋 Trò chuyện được xóa. Tôi là trợ lý tư vấn sách. Bạn cần giúp gì?',
        timestamp: new Date()
      }
    ]);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
