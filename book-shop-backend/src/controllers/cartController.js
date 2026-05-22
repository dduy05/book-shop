const pool = require('../config/db');

// GET /api/cart — Lấy giỏ hàng hiện tại của user
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(`
      SELECT b.id, b.title, b.author, b.category_id, b.price, b.image, b.description, b.created_at,
             c.quantity, b.quantity AS available_quantity
      FROM carts c
      JOIN books b ON b.id = c.book_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('getCart error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy giỏ hàng' });
  }
};

// POST /api/cart — Thêm hoặc tăng số lượng sách trong giỏ hàng
const addToCart = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { book_id, quantity } = req.body;
    const bookId = parseInt(book_id, 10);
    const qty = parseInt(quantity, 10);

    if (!bookId || !qty || qty <= 0) {
      return res.status(400).json({ status: 'error', message: 'book_id và quantity phải hợp lệ' });
    }

    await client.query('BEGIN');

    const bookResult = await client.query('SELECT * FROM books WHERE id = $1 FOR UPDATE', [bookId]);
    if (bookResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy sách' });
    }

    const book = bookResult.rows[0];
    
    // Kiểm tra nếu sách đã hết hàng
    if (book.quantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'Sách đã hết hàng, không thể thêm vào giỏ' });
    }

    // Kiểm tra số lượng trong kho có đủ không
    if (book.quantity < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: `Số lượng trong kho không đủ. Còn lại: ${book.quantity} quyển` });
    }

    const cartResult = await client.query(
      'SELECT id, quantity FROM carts WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    if (cartResult.rowCount > 0) {
      const existingQty = cartResult.rows[0].quantity;
      await client.query(
        'UPDATE carts SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [existingQty + qty, cartResult.rows[0].id]
      );
    } else {
      await client.query(
        'INSERT INTO carts (user_id, book_id, quantity) VALUES ($1, $2, $3)',
        [userId, bookId, qty]
      );
    }

    await client.query('UPDATE books SET quantity = quantity - $1 WHERE id = $2', [qty, bookId]);

    const result = await client.query(`
      SELECT b.id, b.title, b.author, b.category_id, b.price, b.image, b.description, b.created_at,
             c.quantity
      FROM carts c
      JOIN books b ON b.id = c.book_id
      WHERE c.user_id = $1 AND c.book_id = $2
    `, [userId, bookId]);

    await client.query('COMMIT');

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('addToCart error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi thêm sách vào giỏ hàng' });
  } finally {
    client.release();
  }
};

// DELETE /api/cart/:bookId — Xóa sách khỏi giỏ hàng và trả lại tồn kho
const removeFromCart = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const bookId = parseInt(req.params.bookId, 10);

    if (!bookId) {
      return res.status(400).json({ status: 'error', message: 'bookId không hợp lệ' });
    }

    await client.query('BEGIN');

    const cartResult = await client.query(
      'SELECT id, book_id, quantity FROM carts WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    if (cartResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Sách không tồn tại trong giỏ hàng' });
    }

    const cartItem = cartResult.rows[0];
    await client.query('UPDATE books SET quantity = quantity + $1 WHERE id = $2', [cartItem.quantity, bookId]);
    await client.query('DELETE FROM carts WHERE id = $1', [cartItem.id]);

    await client.query('COMMIT');

    res.json({ status: 'success', data: cartItem });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('removeFromCart error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa sách khỏi giỏ hàng' });
  } finally {
    client.release();
  }
};

// DELETE /api/cart — Xóa toàn bộ giỏ hàng và trả lại tồn kho tương ứng
const clearCart = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    await client.query('BEGIN');

    const cartResult = await client.query('SELECT book_id, quantity FROM carts WHERE user_id = $1', [userId]);

    for (const item of cartResult.rows) {
      await client.query('UPDATE books SET quantity = quantity + $1 WHERE id = $2', [item.quantity, item.book_id]);
    }

    await client.query('DELETE FROM carts WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    res.json({ status: 'success', message: 'Đã xóa giỏ hàng và trả lại tồn kho' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('clearCart error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa giỏ hàng' });
  } finally {
    client.release();
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };