-- Demo catalog data for Supabase.
-- Run after database/schema.sql.

insert into public.products (name, description, price, stock, image_url, category, featured)
values
  (
    'Keripik Singkong Balado',
    'Keripik singkong tipis dengan bumbu balado hangat, gurih, dan renyah tahan lama.',
    18000,
    84,
    'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Keripik%20Singkong.png',
    'Keripik',
    true
  ),
  (
    'Basreng Njabrik Level 3',
    'Basreng pedas gurih dengan level favorit pelanggan dan aroma daun jeruk.',
    22000,
    36,
    'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Basreng%20Level%203.png',
    'Basreng',
    true
  ),
  (
    'Makaroni Keju Creamy',
    'Makaroni kriuk dengan taburan keju creamy premium dan rasa ringan.',
    16000,
    12,
    'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Makaroni%20Keju.png',
    'Manis',
    false
  ),
  (
    'Hampers Cemilan Premium',
    'Paket cantik berisi snack best seller untuk hadiah, hampers kantor, dan acara keluarga.',
    89000,
    8,
    'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Hampers.png',
    'Hampers',
    true
  )
on conflict (name) do update set
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  image_url = excluded.image_url,
  category = excluded.category,
  featured = excluded.featured;

insert into public.notifications (title, message, type)
values
  ('Selamat datang', 'Supabase realtime dashboard sudah aktif.', 'system'),
  ('Stok menipis', 'Hampers Premium tersisa 8 pcs.', 'stock'),
  ('Produk unggulan', 'Basreng Njabrik Level 3 masuk daftar featured.', 'product')
on conflict (title, message) do nothing;

-- Admin setup:
-- 1. Create an admin user from Supabase Auth UI or by registering in the app.
-- 2. Promote the profile:
-- update public.profiles set role = 'admin', full_name = 'Admin Nyemil'
-- where id = '<auth-user-id>';
