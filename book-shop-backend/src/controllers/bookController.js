const pool = require('../config/db');

// GET /api/books — Lấy toàn bộ danh sách sách
const getAllBooks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.id DESC
    `);
    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getAllBooks error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách sách' });
  }
};

// GET /api/books/:id — Lấy một quyển sách theo ID
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT b.*, c.name as category_name
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('getBookById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin sách' });
  }
};

// POST /api/books — Thêm sách mới
const createBook = async (req, res) => {
  try {
    const { title, author, category_id, price, image, description } = req.body;

    if (!title || !author || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Các trường title, author, price là bắt buộc'
      });
    }

    const sql = `
      INSERT INTO books (title, author, category_id, price, image, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, category_id, price, image, description]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('createBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi thêm sách mới' });
  }
};

// PUT /api/books/:id — Cập nhật sách theo ID
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category_id, price, image, description } = req.body;

    const sql = `
      UPDATE books
      SET title = $1, author = $2, category_id = $3, price = $4, image = $5, description = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, category_id, price, image, description, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật sách' });
  }
};

// DELETE /api/books/:id — Xóa sách theo ID
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({
      status: 'success',
      message: `Đã xóa sách "${result.rows[0].title}" thành công`
    });
  } catch (err) {
    console.error('deleteBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa sách' });
  }
};

module.exports = { getAllBooks, getBookById, createBook, updateBook, deleteBook };
