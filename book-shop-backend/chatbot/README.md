# 📚 Book Shop Chatbot

Trợ lý tư vấn sách thông minh sử dụng Google Gemini AI.

## ✨ Tính năng

- 💬 Trò chuyện thời gian thực về gợi ý sách
- 🤖 Được hỗ trợ bởi Google Gemini AI
- 📖 Tích hợp với danh sách sách từ cơ sở dữ liệu
- 🎨 Giao diện người dùng thân thiện
- ⚡ Không cần lưu lịch sử chat

## 🚀 Cài đặt

### Backend Setup

1. Cài đặt dependencies:

```bash
cd book-shop-backend/chatbot
npm install
```

2. Tạo file `.env` (đã có mẫu):

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GET_BOOKS_URL=http://localhost:3000/chatbot/get_books
```

3. Lấy Google Gemini API Key:
   - Truy cập [Google AI Studio](https://aistudio.google.com)
   - Tạo API key mới
   - Dán vào `.env`

4. Khởi động chatbot server:

```bash
npm start
```

Server sẽ chạy trên `http://localhost:3001`

### Frontend Setup

Chatbot đã được tích hợp vào frontend chính. Truy cập:

```
http://localhost:4200/chatbot
```

## 📁 Cấu trúc

```
book-shop-backend/
  └── chatbot/
      ├── .env              # Cấu hình biến môi trường
      ├── .gitignore        # Các file cần bỏ qua
      ├── package.json      # Dependencies
      ├── server.js         # Chatbot proxy server
      └── get_books.js      # API lấy sách từ DB

book-shop-frontend/
  └── src/app/pages/chatbot/
      ├── chatbot.ts        # Component logic
      ├── chatbot.html      # Template
      └── chatbot.scss      # Styling
```

## 🔌 API Endpoints

### GET `/chatbot/get_books`
Lấy danh sách sách từ cơ sở dữ liệu.

**Response:**
```json
[
  {
    "id": 1,
    "TenSach": "Tên cuốn sách",
    "TacGia": "Tác giả",
    "Gia": 150000,
    "SoLuong": 10,
    "MoTa": "Mô tả sách",
    "TheLoai": "Thể loại"
  }
]
```

### POST `/api/chat`
Gửi tin nhắn tới chatbot.

**Request:**
```json
{
  "message": "Bạn có cuốn sách nào về lập trình?"
}
```

**Response:**
```json
{
  "reply": "Tôi có các cuốn sách lập trình sau..."
}
```

## 💡 Cách sử dụng

1. Mở trang chatbot: `http://localhost:4200/chatbot`
2. Nhập câu hỏi về sách (VD: "Sách nào về Python?")
3. Chatbot sẽ gợi ý dựa trên danh sách sách có sẵn
4. Nhấn Enter hoặc nút "Gửi" để gửi

## ⚙️ Cấu hình

### Đổi model Gemini

Chỉnh `GEMINI_MODEL` trong `.env`:
- `gemini-3.5-mini` (nhanh, tiết kiệm)
- `gemini-2.0-flash` (nhanh hơn)
- `gemini-pro` (mạnh mẽ hơn)

### Tăng/giảm số lượng sách

Chỉnh `LIMIT 50` trong `get_books.js`

## 🐛 Troubleshooting

**Lỗi: "GEMINI_API_KEY not set"**
- Kiểm tra `.env` có `GEMINI_API_KEY` không
- Đảm bảo server được khởi động lại sau khi thay đổi `.env`

**Lỗi: "Could not fetch books"**
- Kiểm tra backend chính (`http://localhost:3000/api/status`) có chạy
- Kiểm tra `GET_BOOKS_URL` trong `.env` đúng không

**Chatbot không trả lời**
- Kiểm tra API key Google Gemini có hợp lệ
- Kiểm tra quota/limit API key
- Xem logs server để tìm lỗi

## 📝 Ghi chú

- Chatbot không lưu lịch sử chat (mỗi session độc lập)
- API key nên được giữ bí mật (không commit `.env`)

## 🤝 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Tất cả dependencies đã cài chưa
2. `.env` đã được cấu hình đúng
3. Port 3001 không bị chiếm
4. API key Google Gemini hợp lệ
