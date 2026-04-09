const pool = require('../config/db');

// GET /api/categories — Lấy toàn bộ danh sách categories
const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id DESC');
    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getAllCategories error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách categories' });
  }
};

// GET /api/categories/:id — Lấy một category theo ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy category với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('getCategoryById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin category' });
  }
};

// POST /api/categories — Thêm category mới
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Trường name là bắt buộc'
      });
    }

    const sql = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(sql, [name, description]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('createCategory error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi thêm category mới' });
  }
};

// PUT /api/categories/:id — Cập nhật category theo ID
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const sql = `
      UPDATE categories
      SET name = $1, description = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(sql, [name, description, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy category với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateCategory error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật category' });
  }
};

// DELETE /api/categories/:id — Xóa category theo ID
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy category với id = ${id}` });
    }

    res.json({
      status: 'success',
      message: `Đã xóa category "${result.rows[0].name}" thành công`
    });
  } catch (err) {
    console.error('deleteCategory error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa category' });
  }
};

module.exports = { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory };