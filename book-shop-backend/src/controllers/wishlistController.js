const pool = require('../config/db');

// GET /api/wishlist — Lấy wishlist của user hiện tại
const getWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const result = await pool.query(
      `SELECT b.*, c.name as category_name
       FROM wishlists w
       JOIN books b ON w.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    );

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('getWishlist error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách yêu thích' });
  }
};

// POST /api/wishlist — Thêm sách vào wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp book_id' });
    }

    const exists = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND book_id = $2',
      [userId, book_id]
    );

    if (exists.rowCount > 0) {
      return res.status(200).json({ status: 'success', message: 'Sách đã có trong danh sách yêu thích' });
    }

    await pool.query(
      'INSERT INTO wishlists (user_id, book_id) VALUES ($1, $2)',
      [userId, book_id]
    );

    // Trả về thông tin sách vừa thêm
    const result = await pool.query(
      `SELECT b.*, c.name as category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = $1`,
      [book_id]
    );

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('addToWishlist error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi thêm sách vào danh sách yêu thích' });
  }
};

// DELETE /api/wishlist/:bookId — Xóa sách khỏi wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND book_id = $2 RETURNING *',
      [userId, bookId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sách trong wishlist' });
    }

    res.json({ status: 'success', message: 'Đã xóa sách khỏi danh sách yêu thích' });
  } catch (err) {
    console.error('removeFromWishlist error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa sách khỏi danh sách yêu thích' });
  }
};

// DELETE /api/wishlist — Xóa toàn bộ wishlist của user
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user?.id;
    await pool.query('DELETE FROM wishlists WHERE user_id = $1', [userId]);
    res.json({ status: 'success', message: 'Đã xóa toàn bộ wishlist' });
  } catch (err) {
    console.error('clearWishlist error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa toàn bộ wishlist' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };