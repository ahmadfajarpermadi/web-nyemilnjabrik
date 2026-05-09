import { Router } from 'express';
import slugify from 'slugify';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM categories ORDER BY name ASC'));
}));

router.post(
  '/',
  authenticate,
  authorize('admin'),
  body('name').trim().isLength({ min: 3 }),
  validate,
  asyncHandler(async (req, res) => {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    const result = await query(
      'INSERT INTO categories (name, slug, icon, description) VALUES (:name, :slug, :icon, :description)',
      { name: req.body.name, slug, icon: req.body.icon || null, description: req.body.description || null }
    );
    res.status(201).json({ id: result.insertId, slug });
  })
);

export default router;
