import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.post(
  '/register',
  body('name').trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const exists = await query('SELECT id FROM users WHERE email = :email', { email });
    if (exists.length) return res.status(409).json({ message: 'Email sudah digunakan.' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (:name, :email, :password, :phone, "customer")',
      { name, email, password: hashed, phone: phone || null }
    );

    res.status(201).json({ id: result.insertId, name, email, role: 'customer' });
  })
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const users = await query('SELECT * FROM users WHERE email = :email LIMIT 1', { email });
    const user = users[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: payload });
  })
);

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const users = await query('SELECT id, name, email, phone, avatar, role, status, address FROM users WHERE id = :id', {
    id: req.user.id
  });
  res.json(users[0]);
}));

router.post('/forgot-password', body('email').isEmail(), validate, (req, res) => {
  res.json({ message: 'Instruksi reset password akan dikirim jika email terdaftar.' });
});

export default router;
