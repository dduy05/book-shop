const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Helper: lấy danh sách sách gắn với post
const getBooksForPost = async (postId) => {
  const res = await pool.query(
    `SELECT b.* FROM post_books pb JOIN books b ON pb.book_id = b.id WHERE pb.post_id = $1`,
    [postId]
  );
  return res.rows;
};

// GET /api/posts — lấy danh sách bài viết đã duyệt công khai
const getPublicPosts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as author_name FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.status = 'approved' ORDER BY p.id DESC`
    );
    const posts = result.rows;
    for (const post of posts) {
      post.books = await getBooksForPost(post.id);
    }
    res.json({ status: 'success', data: posts });
  } catch (err) {
    console.error('getPublicPosts error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách bài viết' });
  }
};

// GET /api/posts/:id — lấy chi tiết một bài viết đã duyệt

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers['authorization'];
    let currentUserId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (error) {
        // Nếu token không hợp lệ, vẫn tiếp tục xử lý mà không dừng request
      }
    }

    const result = await pool.query(
      `SELECT p.*, u.name as author_name, u.email as author_email FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    }

    const post = result.rows[0];
    if (post.status !== 'approved' && post.author_id !== currentUserId) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết hoặc bài viết chưa được duyệt.' });
    }

    post.books = await getBooksForPost(post.id);
    res.json({ status: 'success', data: post });
  } catch (err) {
    console.error('getPostById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy chi tiết bài viết' });
  }
};

// POST /api/posts — tạo bài mới (user)
const createPost = async (req, res) => {
  try {
    const { title, content, book_ids } = req.body;
    const author_id = req.user.id;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const parsedBookIds = Array.isArray(book_ids)
      ? book_ids.map((id) => Number(id)).filter(Boolean)
      : book_ids ? [Number(book_ids)].filter(Boolean) : [];

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Tiêu đề là bắt buộc' });
    }

    const insertSql = `
      INSERT INTO posts (author_id, title, content, image, status)
      VALUES ($1, $2, $3, $4, 'pending') RETURNING *
    `;
    const result = await pool.query(insertSql, [author_id, title, content, image]);
    const post = result.rows[0];

    if (parsedBookIds.length > 0) {
      const insertMapping = `INSERT INTO post_books (post_id, book_id) VALUES `;
      // Tạo parameterized query
      const values = [];
      const placeholders = [];
      let idx = 1;
      for (const bookId of parsedBookIds) {
        placeholders.push(`($${idx++}, $${idx++})`);
        values.push(post.id, bookId);
      }
      const finalSql = insertMapping + placeholders.join(', ');
      await pool.query(finalSql, values);
    }

    const books = await getBooksForPost(post.id);
    res.status(201).json({ status: 'success', data: { ...post, books } });
  } catch (err) {
    console.error('createPost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi tạo bài viết' });
  }
};

// GET /api/posts/mine — lấy các bài của user hiện tại
const getMyPosts = async (req, res) => {
  try {
    const author_id = req.user.id;
    const result = await pool.query('SELECT * FROM posts WHERE author_id = $1 ORDER BY id DESC', [author_id]);
    const posts = result.rows;
    for (const p of posts) {
      p.books = await getBooksForPost(p.id);
    }
    res.json({ status: 'success', data: posts });
  } catch (err) {
    console.error('getMyPosts error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách bài của bạn' });
  }
};

// PUT /api/posts/:id — chỉnh sửa lại bài (chỉ cho user owner khi bài bị rejected)
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, book_ids } = req.body;
    const userId = req.user.id;
    const parsedBookIds = Array.isArray(book_ids)
      ? book_ids.map((id) => Number(id)).filter(Boolean)
      : book_ids ? [Number(book_ids)].filter(Boolean) : [];

    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    }
    const post = existing.rows[0];

    if (post.author_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền chỉnh sửa bài viết này' });
    }

    if (post.status === 'approved') {
      return res.status(400).json({ status: 'error', message: 'Không thể chỉnh sửa bài viết đã được duyệt' });
    }

    const newImage = req.file ? `/uploads/${req.file.filename}` : post.image;
    if (req.file && post.image) {
      const oldImagePath = path.join(__dirname, '..', '..', 'public', post.image.replace(/^\//, ''));
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.warn('Không xóa được file ảnh cũ:', err.message);
        }
      });
    }

    const updateSql = `
      UPDATE posts SET title = $1, content = $2, image = $3, status = 'pending', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 RETURNING *
    `;
    const result = await pool.query(updateSql, [title ?? post.title, content ?? post.content, newImage, id]);
    const updated = result.rows[0];

    // Cập nhật mapping sách: xóa và chèn lại
    await pool.query('DELETE FROM post_books WHERE post_id = $1', [id]);
    if (parsedBookIds.length > 0) {
      const values = [];
      const placeholders = [];
      let idx = 1;
      for (const bookId of parsedBookIds) {
        placeholders.push(`($${idx++}, $${idx++})`);
        values.push(id, bookId);
      }
      const finalSql = `INSERT INTO post_books (post_id, book_id) VALUES ` + placeholders.join(', ');
      await pool.query(finalSql, values);
    }

    updated.books = await getBooksForPost(id);
    res.json({ status: 'success', data: updated });
  } catch (err) {
    console.error('updatePost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật bài viết' });
  }
};

// ADMIN: GET /api/posts/admin — lấy tất cả bài để quản lý
const getAllPostsAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ORDER BY p.id DESC
    `);
    const posts = result.rows;
    for (const p of posts) {
      p.books = await getBooksForPost(p.id);
    }
    res.json({ status: 'success', data: posts });
  } catch (err) {
    console.error('getAllPostsAdmin error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách bài viết' });
  }
};

// ADMIN: get detail post regardless of status
const getAdminPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.name as author_name, u.email as author_email FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    }
    const post = result.rows[0];
    post.books = await getBooksForPost(post.id);
    res.json({ status: 'success', data: post });
  } catch (err) {
    console.error('getAdminPostById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy chi tiết bài viết' });
  }
};

// ADMIN: approve
const approvePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE posts SET status = 'approved', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    const post = result.rows[0];
    post.books = await getBooksForPost(post.id);
    res.json({ status: 'success', data: post });
  } catch (err) {
    console.error('approvePost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi duyệt bài' });
  }
};

// ADMIN: reject with reason
const rejectPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ status: 'error', message: 'Cần cung cấp lý do từ chối' });

    const result = await pool.query(
      `UPDATE posts SET status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [reason, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    const post = result.rows[0];
    post.books = await getBooksForPost(post.id);
    res.json({ status: 'success', data: post });
  } catch (err) {
    console.error('rejectPost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi từ chối bài' });
  }
};

// ADMIN: delete post
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    res.json({ status: 'success', message: 'Đã xóa bài viết' });
  } catch (err) {
    console.error('deletePost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa bài' });
  }
};

// User: delete own post
const deleteMyPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    }
    const post = existing.rows[0];
    if (post.author_id !== userId) {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền xóa bài viết này' });
    }
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'Đã xóa bài viết của bạn' });
  } catch (err) {
    console.error('deleteMyPost error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa bài viết' });
  }
};

module.exports = {
  getPublicPosts,
  getPostById,
  createPost,
  getMyPosts,
  updatePost,
  getAllPostsAdmin,
  getAdminPostById,
  approvePost,
  rejectPost,
  deletePost,
  deleteMyPost
};
