-- Supabase PostgreSQL schema for Nyemil Njabrik.
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text not null,
  category text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

do $$
begin
  delete from public.products a
  using public.products b
  where a.ctid < b.ctid and a.name = b.name;
  alter table public.products add constraint products_name_key unique (name);
exception when duplicate_object then null;
end $$;

do $$
begin
  delete from public.notifications a
  using public.notifications b
  where a.ctid < b.ctid and a.title = b.title and a.message = b.message;
  alter table public.notifications add constraint notifications_title_message_key unique (title, message);
exception when duplicate_object then null;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Pelanggan Nyemil'),
    'customer',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert own customer" on public.profiles;
create policy "profiles insert own customer"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and role = 'customer');

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (
  public.is_admin()
  or (id = auth.uid() and role = 'customer')
);

drop policy if exists "products public read" on public.products;
create policy "products public read"
on public.products for select
to anon, authenticated
using (true);

drop policy if exists "products admin write" on public.products;
create policy "products admin write"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin"
on public.orders for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders insert own" on public.orders;
create policy "orders insert own"
on public.orders for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update"
on public.orders for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "order items select own or admin" on public.order_items;
create policy "order items select own or admin"
on public.order_items for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "order items insert own order" on public.order_items;
create policy "order items insert own order"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read"
on public.reviews for select
to anon, authenticated
using (true);

drop policy if exists "reviews customer write own" on public.reviews;
create policy "reviews customer write own"
on public.reviews for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reviews update own" on public.reviews;
create policy "reviews update own"
on public.reviews for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reviews delete own or admin" on public.reviews;
create policy "reviews delete own or admin"
on public.reviews for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wishlist own access" on public.wishlist;
create policy "wishlist own access"
on public.wishlist for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications select own or admin" on public.notifications;
create policy "notifications select own or admin"
on public.notifications for select
to authenticated
using (user_id = auth.uid() or user_id is null or public.is_admin());

drop policy if exists "notifications insert own or admin" on public.notifications;
create policy "notifications insert own or admin"
on public.notifications for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications admin update delete" on public.notifications;
drop policy if exists "notifications admin manage" on public.notifications;
create policy "notifications admin manage"
on public.notifications for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "notifications admin delete" on public.notifications;
create policy "notifications admin delete"
on public.notifications for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "product images admin write" on storage.objects;
create policy "product images admin write"
on storage.objects for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
