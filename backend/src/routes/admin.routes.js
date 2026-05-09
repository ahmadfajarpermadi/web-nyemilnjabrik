import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/analytics', asyncHandler(async (req, res) => {
  const [summary] = await query(
    `SELECT
      COALESCE(SUM(total), 0) AS total_revenue,
      COUNT(*) AS total_orders,
      COALESCE((SELECT SUM(sold_count) FROM products), 0) AS sold_products,
      (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers
     FROM orders`
  );

  const revenue = await query(
    `SELECT DATE(created_at) AS date, SUM(total) AS revenue
     FROM orders
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT 14`
  );

  const topProducts = await query(
    `SELECT name, sold_count, stock FROM products ORDER BY sold_count DESC LIMIT 5`
  );

  const categoryStats = await query(
    `SELECT c.name, COUNT(p.id) AS products, SUM(p.sold_count) AS sold
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id
     GROUP BY c.id
     ORDER BY sold DESC`
  );

  res.json({ summary, revenue: revenue.reverse(), topProducts, categoryStats });
}));

router.get('/customers', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, COUNT(o.id) AS total_orders, COALESCE(SUM(o.total), 0) AS total_spent
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id
     ORDER BY total_spent DESC`
  );
  res.json(rows);
}));

router.get('/stock-alerts', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT id, name, stock, min_stock,
      CASE WHEN stock = 0 THEN 'habis' WHEN stock <= min_stock THEN 'menipis' ELSE 'aman' END AS stock_status
     FROM products
     ORDER BY stock ASC`
  );
  res.json(rows);
}));

export default router;
