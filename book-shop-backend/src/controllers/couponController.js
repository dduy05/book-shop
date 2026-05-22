const pool = require('../config/db');

const getAllCoupons = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM coupons
      ORDER BY created_at DESC
    `);

    res.json({ status: 'success', data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('getAllCoupons error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách mã giảm giá' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discount_amount, remaining_quantity, min_order_amount, description } = req.body;

    if (!code || discount_amount == null || remaining_quantity == null || min_order_amount == null) {
      return res.status(400).json({ status: 'error', message: 'Thiếu thông tin mã giảm giá' });
    }

    if (discount_amount < 0 || remaining_quantity < 0 || min_order_amount < 0) {
      return res.status(400).json({ status: 'error', message: 'Giá trị mã giảm giá không hợp lệ' });
    }

    const normalizedCode = String(code).trim().toUpperCase();

    const result = await pool.query(`
      INSERT INTO coupons (code, discount_amount, remaining_quantity, min_order_amount, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [normalizedCode, discount_amount, remaining_quantity, min_order_amount, description || null]);

    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('createCoupon error:', err.message);
    if (err.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Mã giảm giá đã tồn tại' });
    }
    res.status(500).json({ status: 'error', message: 'Lỗi khi tạo mã giảm giá' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount_amount, remaining_quantity, min_order_amount, description } = req.body;

    const existing = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy mã giảm giá' });
    }

    const coupon = existing.rows[0];
    const updatedDiscount = discount_amount != null ? discount_amount : coupon.discount_amount;
    const updatedQuantity = remaining_quantity != null ? remaining_quantity : coupon.remaining_quantity;
    const updatedMinAmount = min_order_amount != null ? min_order_amount : coupon.min_order_amount;
    const updatedDescription = description != null ? description : coupon.description;

    if (updatedDiscount < 0 || updatedQuantity < 0 || updatedMinAmount < 0) {
      return res.status(400).json({ status: 'error', message: 'Giá trị mã giảm giá không hợp lệ' });
    }

    const result = await pool.query(`
      UPDATE coupons
      SET discount_amount = $1,
          remaining_quantity = $2,
          min_order_amount = $3,
          description = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [updatedDiscount, updatedQuantity, updatedMinAmount, updatedDescription, id]);

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('updateCoupon error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật mã giảm giá' });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy mã giảm giá' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('deleteCoupon error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xóa mã giảm giá' });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, order_total } = req.body;

    if (!code || order_total == null) {
      return res.status(400).json({ status: 'error', message: 'Thiếu mã giảm giá hoặc tổng đơn hàng' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const result = await pool.query('SELECT * FROM coupons WHERE code = $1', [normalizedCode]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Mã giảm giá không tồn tại' });
    }

    const coupon = result.rows[0];

    if (coupon.remaining_quantity <= 0) {
      return res.status(400).json({ status: 'error', message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (order_total < coupon.min_order_amount) {
      return res.status(400).json({ status: 'error', message: `Đơn hàng phải có giá trị tối thiểu ${coupon.min_order_amount.toLocaleString('vi-VN')} VND để áp dụng mã này` });
    }

    const applicableDiscount = Math.min(coupon.discount_amount, order_total);
    res.json({
      status: 'success',
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_amount: coupon.discount_amount,
        remaining_quantity: coupon.remaining_quantity,
        min_order_amount: coupon.min_order_amount,
        description: coupon.description,
        applicable_discount: applicableDiscount,
        discounted_total: Math.max(0, order_total - applicableDiscount)
      }
    });
  } catch (err) {
    console.error('validateCoupon error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi xác thực mã giảm giá' });
  }
};

module.exports = {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon
};
