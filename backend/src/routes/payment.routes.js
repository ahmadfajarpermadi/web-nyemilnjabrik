import { Router } from 'express';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.post(
  '/',
  authenticate,
  body('order_id').isInt(),
  body('method').isIn(['bank_transfer', 'ewallet', 'cod']),
  body('amount').isFloat({ min: 1 }),
  validate,
  asyncHandler(async (req, res) => {
    const result = await query(
      'INSERT INTO payments (order_id, method, amount, proof_image, status) VALUES (:order_id, :method, :amount, :proof_image, "waiting")',
      { ...req.body, proof_image: req.body.proof_image || null }
    );
    req.app.get('io').emit('notification', { title: 'Pembayaran masuk', message: `Payment #${result.insertId} menunggu verifikasi.` });
    res.status(201).json({ id: result.insertId });
  })
);

router.patch('/:id/verify', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await query('UPDATE payments SET status = :status, paid_at = CASE WHEN :status = "verified" THEN NOW() ELSE paid_at END WHERE id = :id', {
    id: req.params.id,
    status: req.body.status
  });
  res.json({ message: 'Status pembayaran diperbarui.' });
}));

export default router;
