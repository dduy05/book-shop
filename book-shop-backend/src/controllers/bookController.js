const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const getUploadedImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

const getStoragePathFromImage = (imageUrl) => {
  if (!imageUrl) return null;
  const uploadSegment = '/uploads/';
  const idx = imageUrl.indexOf(uploadSegment);
  if (idx === -1) return null;
  const fileName = imageUrl.slice(idx + uploadSegment.length);
  return path.join(__dirname, '..', '..', 'public', 'uploads', fileName);
};

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
    const { title, author, category_id, price, quantity, image, description } = req.body;
    const parsedCategoryId = category_id ? parseInt(category_id, 10) : null;
    const parsedPrice = price !== undefined ? parseFloat(price) : null;
    const parsedQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) : 0;
    const uploadedImage = req.file ? getUploadedImageUrl(req, req.file.filename) : image || null;

    if (!title || !author || !parsedPrice) {
      return res.status(400).json({
        status: 'error',
        message: 'Các trường title, author, price là bắt buộc'
      });
    }

    const sql = `
      INSERT INTO books (title, author, category_id, price, quantity, image, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, parsedCategoryId, parsedPrice, parsedQuantity, uploadedImage, description]);

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
    const { title, author, category_id, price, quantity, image, description } = req.body;
    const parsedCategoryId = category_id ? parseInt(category_id, 10) : null;
    const parsedPrice = price !== undefined ? parseFloat(price) : null;
    const parsedQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) : 0;
    const newImage = req.file ? getUploadedImageUrl(req, req.file.filename) : image || null;

    const currentResult = await pool.query('SELECT image FROM books WHERE id = $1', [id]);
    if (currentResult.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    const previousImage = currentResult.rows[0].image;
    if (req.file && previousImage) {
      const previousPath = getStoragePathFromImage(previousImage);
      if (previousPath && fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    }

    const sql = `
      UPDATE books
      SET title = $1, author = $2, category_id = $3, price = $4, quantity = $5, image = $6, description = $7
      WHERE id = $8
      RETURNING *
    `;
    const result = await pool.query(sql, [title, author, parsedCategoryId, parsedPrice, parsedQuantity, newImage, description, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateBook error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật sách' });
  }
};

// PATCH /api/books/:id/quantity — Cập nhật tồn kho sách (có thể tăng hoặc giảm)
const updateBookQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, delta } = req.body;

    let newQuantity;

    if (delta !== undefined && typeof delta === 'number') {
      // Nếu có delta, lấy quantity hiện tại và cộng delta
      const currentResult = await pool.query('SELECT quantity FROM books WHERE id = $1', [id]);
      if (currentResult.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
      }
      newQuantity = currentResult.rows[0].quantity + delta;
    } else if (quantity !== undefined && typeof quantity === 'number' && quantity >= 0) {
      // Nếu có quantity tuyệt đối
      newQuantity = quantity;
    } else {
      return res.status(400).json({ status: 'error', message: 'Cần cung cấp quantity (tuyệt đối) hoặc delta (tương đối)' });
    }

    if (newQuantity < 0) {
      return res.status(400).json({ status: 'error', message: 'Số lượng không thể âm' });
    }

    const result = await pool.query(
      'UPDATE books SET quantity = $1 WHERE id = $2 RETURNING *',
      [newQuantity, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: `Không tìm thấy sách với id = ${id}` });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateBookQuantity error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật tồn kho sách' });
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

module.exports = { getAllBooks, getBookById, createBook, updateBook, updateBookQuantity, deleteBook };
