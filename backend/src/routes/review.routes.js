import { Router } from 'express';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.get('/product/:productId', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.*, u.name AS customer_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = :productId
     ORDER BY r.created_at DESC`,
    { productId: req.params.productId }
  );
  res.json(rows);
}));

router.post(
  '/',
  authenticate,
  body('product_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  validate,
  asyncHandler(async (req, res) => {
    const result = await query(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (:user_id, :product_id, :order_id, :rating, :comment)',
      { user_id: req.user.id, product_id: req.body.product_id, order_id: req.body.order_id || null, rating: req.body.rating, comment: req.body.comment || null }
    );
    req.app.get('io').emit('notification', { title: 'Review baru', message: `Rating ${req.body.rating} ditambahkan.` });
    res.status(201).json({ id: result.insertId });
  })
);

export default router;
