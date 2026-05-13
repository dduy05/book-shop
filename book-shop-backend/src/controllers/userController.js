const pool = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/users — Lấy tất cả users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getAllUsers error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách người dùng' });
  }
};

// GET /api/users/:id — Lấy thông tin một user
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT id, name, email, role, created_at
      FROM users
      WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('getUserById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thông tin người dùng' });
  }
};

// PUT /api/users/:id/role — Cập nhật role của user (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Role không hợp lệ' });
    }

    const result = await pool.query(`
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, name, email, role, created_at
    `, [role, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }

    res.json({
      status: 'success',
      message: 'Cập nhật role thành công',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('updateUserRole error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật role' });
  }
};

// PUT /api/users/:id — Cập nhật thông tin user (có thể đổi password)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }

    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(email);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password = $${paramIndex++}`);
      updateValues.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Không có thông tin nào để cập nhật' });
    }

    updateValues.push(id);
    const sql = `
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, created_at
    `;

    const result = await pool.query(sql, updateValues);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }

    res.json({
      status: 'success',
      message: 'Cập nhật thông tin thành công',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('updateUser error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật thông tin người dùng' });
  }
};

// DELETE /api/users/:id — Xóa user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra không cho phép xóa admin cuối cùng
    const adminCountResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['ADMIN']);
    const userRoleResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);

    if (userRoleResult.rowCount > 0 && userRoleResult.rows[0].role === 'ADMIN' && adminCountResult.rows[0].count <= 1) {
      return res.status(400).json({ status: 'error', message: 'Không thể xóa admin cuối cùng' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }

    res.json({
      status: 'success',
      message: 'Xóa người dùng thành công'
    });
  } catch (err) {
    console.error('deleteUser error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa người dùng' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUser,
  deleteUser
};