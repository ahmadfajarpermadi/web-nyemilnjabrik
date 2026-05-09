import { Router } from 'express';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT * FROM notifications
     WHERE user_id IS NULL OR user_id = :userId
     ORDER BY created_at DESC
     LIMIT 50`,
    { userId: req.user.id }
  );
  res.json(rows);
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE id = :id AND (user_id IS NULL OR user_id = :userId)', {
    id: req.params.id,
    userId: req.user.id
  });
  res.json({ message: 'Notifikasi ditandai dibaca.' });
}));

export default router;
