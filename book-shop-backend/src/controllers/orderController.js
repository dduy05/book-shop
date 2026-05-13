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
      ${whereClause}
      GROUP BY o.id
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
    const { shipping_address, payment_method, cart_items } = req.body;

    if (!cart_items || cart_items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Giỏ hàng trống' });
    }

    // Tính tổng tiền và kiểm tra tồn kho
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart_items) {
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
      if (book.quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          status: 'error',
          message: `Sách "${book.title}" không đủ số lượng trong kho`
        });
      }

      totalAmount += book.price * item.quantity;
      orderItems.push({
        book_id: item.id,
        quantity: item.quantity,
        price: book.price
      });
    }

    // Tạo đơn hàng
    const orderResult = await client.query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, totalAmount, 'PENDING', shipping_address, payment_method]);

    const orderId = orderResult.rows[0].id;

    // Thêm chi tiết đơn hàng (số lượng đã được giảm khi thêm vào giỏ hàng)
    for (const item of orderItems) {
      await client.query(`
        INSERT INTO order_details (order_id, book_id, quantity, price)
        VALUES ($1, $2, $3, $4)
      `, [orderId, item.book_id, item.quantity, item.price]);
    }

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