# Nyemil Njabrik

Modern UMKM snack ecommerce and dashboard system built with React, Vite, Tailwind CSS, Supabase Auth, Supabase PostgreSQL, Supabase Storage, and Vercel.

## Struktur

```text
nyemil-njabrik/
  frontend/        React + Vite + Tailwind + Supabase SDK
  database/        Supabase PostgreSQL schema, RLS policies, and seed data
  .github/         CI build workflow
```

The previous Express/MySQL backend has been removed. The frontend now talks directly to Supabase with RLS-protected queries.

## Local Setup

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm run install:all
```

3. Create a Supabase project.
4. Run SQL in order:

```text
database/schema.sql
database/seed.sql
```

5. Create `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

6. Fill env values:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SITE_URL=http://localhost:5173
```

7. Start the app:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

## Supabase Auth

Register users from the app or create them in Supabase Auth. New users automatically get a row in `profiles` with role `customer`.

To promote an admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin Nyemil'
where id = '<auth-user-id>';
```

Admin users are redirected to `/admin`; customer users are redirected to `/customer`.

## Supabase Storage

`database/schema.sql` creates a public `product-images` bucket and RLS policies. Admin product uploads use `frontend/src/lib/storage.js` and store public image URLs in `products.image_url`.

## Production Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

Set Vercel Root Directory to `frontend`.

Environment variables:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SITE_URL=https://your-domain.vercel.app
```

Vercel config is in `frontend/vercel.json`, including SPA rewrites and production cache/security headers.

Manual deploy:

```bash
cd frontend
npm ci
npm run build
vercel deploy --prod
```

## Features

- Premium responsive ecommerce UI with dark mode and smooth animations.
- Supabase Auth login, register, logout, forgot password, persisted session.
- Role-based protected routes for `admin` and `customer`.
- Product browse, cart, checkout, order tracking, wishlist toggle.
- Admin dashboard with Supabase realtime refresh for orders, products, notifications, and stock.
- Product add/edit/delete with Supabase Storage image uploads.
- PostgreSQL schema with RLS policies for authenticated customer access and admin-only writes.
- SEO metadata, sitemap, robots.txt, and Vercel-ready deployment.

## Deployment Checklist

- Run `database/schema.sql` then `database/seed.sql`.
- Enable email auth in Supabase Auth settings.
- Add production domain to Supabase Auth redirect URLs.
- Promote at least one profile to `admin`.
- Set Vercel env variables before deploying.
- Update `frontend/public/sitemap.xml`, `frontend/public/robots.txt`, and canonical metadata to the final production domain.
