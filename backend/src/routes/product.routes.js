import { Router } from 'express';
import slugify from 'slugify';
import { body } from 'express-validator';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, validate } from '../utils/http.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const { search = '', category = '', featured } = req.query;
  const rows = await query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE (:search = '' OR p.name LIKE CONCAT('%', :search, '%'))
       AND (:category = '' OR c.slug = :category)
       AND (:featured IS NULL OR p.is_featured = :featured)
     ORDER BY p.created_at DESC`,
    { search, category, featured: featured === undefined ? null : Number(featured) }
  );
  res.json(rows);
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.slug = :slug`,
    { slug: req.params.slug }
  );

  if (!rows[0]) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
  res.json(rows[0]);
}));

router.post(
  '/',
  authenticate,
  authorize('admin'),
  body('name').trim().isLength({ min: 3 }),
  body('price').isFloat({ min: 1 }),
  body('stock').isInt({ min: 0 }),
  validate,
  asyncHandler(async (req, res) => {
    const slug = slugify(req.body.name, { lower: true, strict: true });
    const result = await query(
      `INSERT INTO products (category_id, name, slug, price, discount_percent, stock, min_stock, description, images, is_featured)
       VALUES (:category_id, :name, :slug, :price, :discount_percent, :stock, :min_stock, :description, :images, :is_featured)`,
      {
        ...req.body,
        slug,
        discount_percent: req.body.discount_percent || 0,
        min_stock: req.body.min_stock || 10,
        images: JSON.stringify(req.body.images || []),
        is_featured: Boolean(req.body.is_featured)
      }
    );
    res.status(201).json({ id: result.insertId, slug });
  })
);

router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const slug = slugify(req.body.name, { lower: true, strict: true });
  await query(
    `UPDATE products
     SET category_id = :category_id, name = :name, slug = :slug, price = :price,
         discount_percent = :discount_percent, stock = :stock, min_stock = :min_stock,
         description = :description, images = :images, is_featured = :is_featured
     WHERE id = :id`,
    {
      ...req.body,
      id: req.params.id,
      slug,
      images: JSON.stringify(req.body.images || []),
      is_featured: Boolean(req.body.is_featured)
    }
  );
  res.json({ message: 'Produk berhasil diperbarui.' });
}));

router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await query('DELETE FROM products WHERE id = :id', { id: req.params.id });
  res.json({ message: 'Produk berhasil dihapus.' });
}));

export default router;
