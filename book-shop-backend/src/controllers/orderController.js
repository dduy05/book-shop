const pool = require('../config/db');

// GET /api/orders — Lấy danh sách đơn hàng của user hiện tại
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id; // Từ middleware auth

    const result = await pool.query(`
      SELECT o.*, UPPER(o.status) AS status, json_agg(
        json_build_object(
          'id', od.id,
          'book_id', od.book_id,
          'quantity', od.quantity,
          'price', od.price,
          'book_title', b.title,
          'book_author', b.author,
          'book_image', b.image
        )
      ) as items
      FROM orders o
      LEFT JOIN order_details od ON o.id = od.order_id
      LEFT JOIN books b ON od.book_id = b.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getUserOrders error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

// GET /api/orders/:id — Lấy chi tiết một đơn hàng
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const queryParams = [id];
    let whereClause = 'WHERE o.id = $1';

    if (req.user.role !== 'ADMIN') {
      whereClause += ' AND o.user_id = $2';
      queryParams.push(userId);
    }

    const result = await pool.query(`
      SELECT o.*, UPPER(o.status) AS status,
        u.name AS user_name,
        u.email AS user_email,
        (
          SELECT json_agg(json_build_object(
            'id', od.id,
            'book_id', od.book_id,
            'quantity', od.quantity,
            'price', od.price,
            'book_title', b.title,
            'book_author', b.author,
            'book_image', b.image
          ))
          FROM order_details od
          LEFT JOIN books b ON od.book_id = b.id
          WHERE od.order_id = o.id
        ) AS items,
        (
          SELECT json_agg(json_build_object(
            'id', oc.id,
            'coupon_id', oc.coupon_id,
            'code', oc.code,
            'applied_discount_amount', oc.discount_amount,
            'coupon_discount_amount', c.discount_amount
          ))
          FROM order_coupons oc
          LEFT JOIN coupons c ON oc.coupon_id = c.id
          WHERE oc.order_id = o.id
        ) AS coupons
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `, queryParams);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('getOrderById error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy chi tiết đơn hàng' });
  }
};

// POST /api/orders — Tạo đơn hàng mới từ giỏ hàng
const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userId = req.user.id;
    const { shipping_address, payment_method, coupon_codes = [] } = req.body;

    const cartResult = await client.query(
      'SELECT book_id AS id, quantity FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cartResult.rowCount === 0) {
      return res.status(400).json({ status: 'error', message: 'Giỏ hàng trống' });
    }

    // Tính tổng tiền và kiểm tra tồn kho đã được reservation khi thêm vào giỏ hàng
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cartResult.rows) {
      const bookResult = await client.query(
        'SELECT * FROM books WHERE id = $1',
        [item.id]
      );

      if (bookResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: `Sách với id ${item.id} không tồn tại`
        });
      }

      const book = bookResult.rows[0];
      totalAmount += book.price * item.quantity;
      orderItems.push({
        book_id: item.id,
        quantity: item.quantity,
        price: book.price
      });
    }

    const appliedCouponCodes = Array.isArray(coupon_codes)
      ? [...new Set(coupon_codes.map((code) => String(code).trim().toUpperCase()).filter(Boolean))]
      : [];

    let discountAmount = 0;
    const appliedCoupons = [];

    for (const code of appliedCouponCodes) {
      const couponResult = await client.query('SELECT * FROM coupons WHERE code = $1', [code]);
      if (couponResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: `Mã giảm giá ${code} không tồn tại` });
      }

      const coupon = couponResult.rows[0];
      if (coupon.remaining_quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'error', message: `Mã giảm giá ${code} đã hết lượt sử dụng` });
      }

      if (totalAmount < coupon.min_order_amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: `Mã ${code} chỉ áp dụng cho đơn từ ${coupon.min_order_amount.toLocaleString('vi-VN')} VND trở lên`
        });
      }

      const remainingAmount = Math.max(0, totalAmount - discountAmount);
      const appliedAmount = Math.min(coupon.discount_amount, remainingAmount);
      discountAmount += appliedAmount;
      appliedCoupons.push({ coupon, appliedAmount });
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    const orderResult = await client.query(`
      INSERT INTO orders (user_id, original_amount, discount_amount, total_amount, status, shipping_address, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, totalAmount, discountAmount, finalAmount, 'PENDING', shipping_address, payment_method]);

    const orderId = orderResult.rows[0].id;

    for (const item of orderItems) {
      await client.query(`
        INSERT INTO order_details (order_id, book_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.book_id, item.quantity, item.price]);
    }

    for (const applied of appliedCoupons) {
      await client.query(`
        INSERT INTO order_coupons (order_id, coupon_id, code, discount_amount)
        VALUES ($1, $2, $3, $4)
      `, [orderId, applied.coupon.id, applied.coupon.code, applied.appliedAmount]);

      await client.query(`
        UPDATE coupons
        SET remaining_quantity = remaining_quantity - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [applied.coupon.id]);
    }

    await client.query('DELETE FROM carts WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Đặt hàng thành công',
      data: orderResult.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createOrder error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi tạo đơn hàng' });
  } finally {
    client.release();
  }
};

// PUT /api/orders/:id/status — Cập nhật trạng thái đơn hàng (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ status: 'error', message: 'Trạng thái không hợp lệ' });
    }

    const result = await pool.query(`
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [normalizedStatus, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn hàng' });
    }

    res.json({
      status: 'success',
      message: 'Cập nhật trạng thái thành công',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('updateOrderStatus error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật trạng thái' });
  }
};

// GET /api/orders/admin/all — Lấy tất cả đơn hàng (admin only)
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, UPPER(o.status) AS status, u.name as user_name, u.email as user_email,
      json_agg(
        json_build_object(
          'id', od.id,
          'book_id', od.book_id,
          'quantity', od.quantity,
          'price', od.price,
          'book_title', b.title,
          'book_author', b.author
        )
      ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_details od ON o.id = od.order_id
      LEFT JOIN books b ON od.book_id = b.id
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      status: 'success',
      data: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('getAllOrders error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách đơn hàng' });
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getAllOrders
};