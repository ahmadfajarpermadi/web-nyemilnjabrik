import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = :userId
     ORDER BY w.created_at DESC`,
    { userId: req.user.id }
  );
  res.json(rows);
}));

router.post('/:productId', authenticate, asyncHandler(async (req, res) => {
  await query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (:userId, :productId)', {
    userId: req.user.id,
    productId: req.params.productId
  });
  res.status(201).json({ message: 'Produk ditambahkan ke wishlist.' });
}));

router.delete('/:productId', authenticate, asyncHandler(async (req, res) => {
  await query('DELETE FROM wishlist WHERE user_id = :userId AND product_id = :productId', {
    userId: req.user.id,
    productId: req.params.productId
  });
  res.json({ message: 'Produk dihapus dari wishlist.' });
}));

export default router;
