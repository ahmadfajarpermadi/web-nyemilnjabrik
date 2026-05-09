import { Router } from 'express';
import { body } from 'express-validator';
import { query, pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const rows = await query(
    `SELECT o.*, u.name AS customer_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE (:isAdmin = 1 OR o.user_id = :userId)
     ORDER BY o.created_at DESC`,
    { isAdmin: isAdmin ? 1 : 0, userId: req.user.id }
  );
  res.json(rows);
}));

router.post(
  '/',
  authenticate,
  body('items').isArray({ min: 1 }),
  body('recipient_name').notEmpty(),
  body('recipient_phone').notEmpty(),
  body('shipping_address').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const subtotal = req.body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discount = Number(req.body.discount || 0);
      const shipping = Number(req.body.shipping_cost || 10000);
      const total = subtotal - discount + shipping;
      const orderCode = `NN-${Date.now()}`;

      const [orderResult] = await connection.execute(
        `INSERT INTO orders (order_code, user_id, subtotal, discount, shipping_cost, total, recipient_name, recipient_phone, shipping_address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderCode, req.user.id, subtotal, discount, shipping, total, req.body.recipient_name, req.body.recipient_phone, req.body.shipping_address, req.body.notes || null]
      );

      for (const item of req.body.items) {
        await connection.execute(
          'INSERT INTO order_details (order_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
          [orderResult.insertId, item.product_id, item.quantity, item.price, item.price * item.quantity]
        );
        await connection.execute('UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?', [
          item.quantity,
          item.quantity,
          item.product_id
        ]);
      }

      await connection.commit();
      req.app.get('io').emit('notification', { title: 'Pesanan baru', message: `${orderCode} masuk.` });
      res.status(201).json({ id: orderResult.insertId, order_code: orderCode, total });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

router.patch('/:id/status', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await query('UPDATE orders SET status = :status WHERE id = :id', {
    id: req.params.id,
    status: req.body.status
  });
  req.app.get('io').emit('notification', { title: 'Status pesanan diperbarui', message: `Order #${req.params.id}: ${req.body.status}` });
  res.json({ message: 'Status berhasil diperbarui.' });
}));

export default router;
