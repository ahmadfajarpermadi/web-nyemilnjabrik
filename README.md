# Nyemil Njabrik

Website UMKM modern untuk penjualan snack/cemilan dengan dua role utama: customer dan admin. Proyek ini memakai React + Vite untuk frontend, Express API untuk backend, JWT authentication, MySQL schema lengkap, dashboard analytics, CRUD produk, order monitoring, dan dummy data.

## Struktur

```text
nyemil-njabrik/
  frontend/        React + Vite + Tailwind + Framer Motion + Recharts
  backend/         Express REST API + JWT + MySQL
  database/        Schema, migration-style SQL, dan seed dummy data
```

## Setup Cepat

1. Install Node.js 20+ dan MySQL 8+.
2. Install dependencies:

```bash
npm run install:all
```

3. Buat database:

```sql
CREATE DATABASE nyemil_njabrik;
```

4. Jalankan schema dan seed:

```bash
mysql -u root -p nyemil_njabrik < database/schema.sql
mysql -u root -p nyemil_njabrik < database/seed.sql
```

5. Salin env backend:

```bash
cp backend/.env.example backend/.env
```

6. Jalankan full-stack:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend API: `http://localhost:4000/api`

## Environment

Backend memakai `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Frontend memakai `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

Nilai produksi yang wajib disiapkan:

- `frontend`: `VITE_API_URL=https://nyemil-njabrik-api.onrender.com/api`
- `frontend`: `VITE_SITE_URL=https://nyemil-njabrik.vercel.app`
- `backend`: `NODE_ENV=production`
- `backend`: `CLIENT_URLS=https://nyemil-njabrik.vercel.app`
- `backend`: `JWT_SECRET=<secret panjang dan acak>`
- `backend`: `DATABASE_URL=mysql://user:password@host:3306/database`
- `backend`: `DB_SSL=true` jika provider MySQL mensyaratkan TLS

## Build Produksi

```bash
npm run build
npm start --prefix backend
```

Health check backend:

```bash
curl http://localhost:4000/api/health
```

## Deploy Frontend ke Vercel

Konfigurasi Vercel ada di `frontend/vercel.json`. Di dashboard Vercel, set **Root Directory** ke `frontend`.

Environment Variables:

```text
VITE_API_URL=https://nyemil-njabrik-api.onrender.com/api
VITE_SITE_URL=https://nyemil-njabrik.vercel.app
```

Command manual:

```bash
cd frontend
npm ci
npm run build
vercel deploy --prod
```

Jika memakai Git integration, push branch `main` setelah env diisi. Vercel akan menjalankan `npm ci` dan `npm run build`, lalu melayani `dist`.

## Deploy Backend ke Render

Blueprint Render ada di `render.yaml`. Backend berjalan dari folder `backend` dengan health check `/api/health`.

Environment Variables di Render:

```text
NODE_ENV=production
CLIENT_URLS=https://nyemil-njabrik.vercel.app
JWT_SECRET=<generate otomatis atau isi secret panjang>
DATABASE_URL=mysql://user:password@host:3306/database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

Render tidak menyediakan MySQL native di semua plan. Pakai MySQL eksternal seperti Aiven, PlanetScale-compatible provider, Railway, atau server MySQL sendiri, lalu masukkan connection string ke `DATABASE_URL`.

Command manual Render:

```bash
cd backend
npm ci
npm start
```

## Deployment Checklist

- Jalankan schema dan seed ke database produksi sebelum membuka website.
- Deploy backend lebih dulu, pastikan `/api/health` mengembalikan status `ok`.
- Isi `VITE_API_URL` frontend dengan URL backend HTTPS Render yang berakhiran `/api`.
- Isi `CLIENT_URLS` backend dengan domain Vercel produksi. Tambahkan preview domain dipisah koma bila perlu.
- Setelah deploy frontend, uji route langsung seperti `/shop`, `/product/basreng-njabrik-level-3`, `/login`, dan `/admin`.
- Pastikan sitemap dan canonical URL disesuaikan dari placeholder `nyemil-njabrik.vercel.app` ke domain final.
- Jangan commit file `.env`; commit hanya `.env.example`.

## Demo Login

- Admin: `admin@nyemilnjabrik.test` / `password123`
- Customer: `sari@example.com` / `password123`

## Fitur Utama

- Landing page premium UMKM, shop, product detail, cart, checkout, tracking, customer dashboard.
- Admin dashboard SaaS-style dengan analytics cards, chart revenue, recent order, order table, product CRUD UI, stock alert, customer management, notification center, laporan.
- Dark/light mode, responsive mobile-first, protected route, reusable components, skeleton loading, toast alert, search suggestion, wishlist, recently viewed.
- Backend REST API dengan JWT multi-role, Helmet, CORS, validation, MySQL prepared query, Socket.IO notification.

## Catatan

UI frontend memakai dummy data lokal agar tampilan langsung bisa dieksplor. Endpoint API backend sudah disiapkan dengan kontrak yang sama sehingga integrasi data real tinggal mengganti service di `frontend/src/lib/api.js`.
