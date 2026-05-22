const pool = require('../config/db');

// GET /api/stats/best-selling?limit=1
const getBestSelling = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 1;
    const result = await pool.query(`
      SELECT b.*, COALESCE(SUM(od.quantity), 0) AS sold_count
      FROM books b
      LEFT JOIN order_details od ON b.id = od.book_id
      GROUP BY b.id
      ORDER BY COALESCE(SUM(od.quantity), 0) DESC
      LIMIT $1
    `, [limit]);

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('getBestSelling error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy sách bán chạy' });
  }
};

// GET /api/stats/monthly-revenue?months=12
const getMonthlyRevenue = async (req, res) => {
  try {
    const months = parseInt(req.query.months, 10) || 12;

    const result = await pool.query(`
      SELECT to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
             COALESCE(SUM(o.total_amount), 0) AS revenue
      FROM orders o
      WHERE o.status IN ('CONFIRMED','DELIVERED')
      GROUP BY date_trunc('month', o.created_at)
      ORDER BY date_trunc('month', o.created_at) DESC
      LIMIT $1
    `, [months]);

    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('getMonthlyRevenue error:', err.message);
    res.status(500).json({ status: 'error', message: 'Lỗi khi lấy thống kê doanh thu' });
  }
};

module.exports = {
  getBestSelling,
  getMonthlyRevenue
};
