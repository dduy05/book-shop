// server.js - Express server that proxies chat requests to Google Gemini
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const PORT = process.env.PORT || 3001;
const BOOKS_API = process.env.GET_BOOKS_URL || 'http://localhost:3000/chatbot/get_books';
const COUPONS_API = process.env.GET_COUPONS_URL || 'http://localhost:3000/chatbot/get_coupons';
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. Set GEMINI_API_KEY in environment.');
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Book Chatbot Server' }));

// POST /api/chat - Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'message required' });
    }

    // Fetch book list from backend
    let books = [];
    try {
      const r = await axios.get(BOOKS_API, { timeout: 5000 });
      books = Array.isArray(r.data) ? r.data : [];
    } catch (e) {
      console.warn('Could not fetch books:', e.message);
    }

    // Fetch coupon list from backend
    let coupons = [];
    try {
      const r = await axios.get(COUPONS_API, { timeout: 5000 });
      coupons = Array.isArray(r.data) ? r.data : [];
    } catch (e) {
      console.warn('Could not fetch coupons:', e.message);
    }

    // Build context with book info (limit to 50)
    const bookContext = books.slice(0, 50).map(b => {
      const giaValue = b.Gia ?? b.gia;
      const gia = giaValue ? `${Number(giaValue).toLocaleString('vi-VN')}₫` : 'N/A';
      const soLuong = b.SoLuong ?? b.soluong ?? 'N/A';
      const tacGia = b.TacGia || b.tacgia || 'N/A';
      const theLoai = b.TheLoai || b.theloai || 'N/A';
      const tenSach = b.TenSach || b.tensach || 'N/A';
      const moTa = b.MoTa || b.mota || 'N/A';
      return `- ${tenSach} (ID: ${b.id}, Tác Giả: ${tacGia}, Giá: ${gia}, Thể Loại: ${theLoai}, Tồn Kho: ${soLuong}): ${moTa}`;
    }).join('\n');

    // Build context with coupon info (limit to 20)
    const couponContext = coupons.slice(0, 20).map(c => {
      const mucGiam = c.mucgiam ?? c.discount_amount ?? 'N/A';
      const soLuong = c.soluongcon ?? c.remaining_quantity ?? 'N/A';
      const donHangMin = c.donhangtoithieu ?? c.min_order_amount ?? 'N/A';
      const code = c.mamg ?? c.code ?? 'N/A';
      const moTa = c.mota ?? c.description ?? '';
      return `- Mã: ${code}, Giảm: ${mucGiam}₫, Đơn hàng tối thiểu: ${donHangMin}₫, Số lượng còn: ${soLuong} ${moTa ? `(${moTa})` : ''}`;
    }).join('\n');

    const system = `Bạn là trợ lý tư vấn sách thông minh. Dựa trên danh sách sách và mã giảm giá được cung cấp, hãy giúp khách hàng tìm kiếm sách, gợi ý những cuốn sách phù hợp và thông báo về các mã giảm giá có sẵn. Khi trả lời, hãy bao gồm tên sách, tác giả, thể loại, giá cả và tồn kho nếu liên quan. Nếu khách hàng hỏi về mã giảm giá hoặc khuyến mãi, hãy gợi ý những mã giảm giá có sẵn phù hợp với đơn hàng của họ. Trả lời bằng văn bản thuần túy, không sử dụng định dạng Markdown hoặc ký tự nhấn nổi bật như ** hoặc __. Trả lời ngắn gọn nhưng thông tin đầy đủ.`;
    const prompt = `SYSTEM:\n${system}\n\nDanh sách sách có sẵn:\n${bookContext}\n\nDanh sách mã giảm giá có sẵn:\n${couponContext}\n\nCâu hỏi từ khách hàng:\n${message}\n\nTrợ lý:`;

    let modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    if (modelName.startsWith('models/')) {
      modelName = modelName.replace('models/', '');
    }

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/\*\*/g, '');
      text = text.replace(/__/g, '');
      text = text.replace(/`/g, '');

      return res.json({ reply: text.trim() });
    } catch (genErr) {
      console.error('generateContent error:', genErr.message || genErr);
      if ((genErr && genErr.code === 404) || /not found/i.test(String(genErr && genErr.message))) {
        return res.status(400).json({ error: 'model_not_found', message: String(genErr && genErr.message) });
      }
      return res.status(500).json({ error: 'generate_failed', message: String(genErr && genErr.message) });
    }
  } catch (err) {
    console.error('Chat error:', err.message || err);
    res.status(500).json({ error: 'internal_error', message: err.message || err });
  }
});

app.listen(PORT, () => {
  console.log(`📚 Book Chatbot Server listening on port ${PORT}`);
  console.log(`   API endpoint: http://localhost:${PORT}/api/chat`);
});
