import slugify from 'slugify';
import { isSupabaseConfigured, supabase } from './supabase.js';
import { reportError } from './errors.js';
import { uploadProductImage } from './storage.js';

function ensureSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }
}

export function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug || slugify(row.name || '', { lower: true, strict: true }),
    category: row.category,
    price: Number(row.price || 0),
    discount: Number(row.discount || 0),
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 4.8),
    sold: Number(row.sold || 0),
    image: row.image_url,
    image_url: row.image_url,
    description: row.description,
    featured: Boolean(row.featured)
  };
}

export function toOrder(row) {
  const firstItem = row.order_items?.[0];
  const productNames = row.order_items?.map((item) => item.products?.name).filter(Boolean).join(', ');

  return {
    id: row.id,
    customer: row.profiles?.full_name || 'Customer',
    product: productNames || firstItem?.products?.name || 'Order',
    total: Number(row.total || 0),
    status: row.status,
    time: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.created_at)),
    created_at: row.created_at,
    order_items: row.order_items || []
  };
}

export async function getProducts() {
  try {
    ensureSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, stock, image_url, category, featured, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(toProduct);
  } catch (error) {
    throw new Error(reportError('db.products.list', error));
  }
}

export async function createProduct(payload, imageFile) {
  try {
    ensureSupabase();
    const imageUrl = imageFile ? await uploadProductImage(imageFile) : payload.image_url;
    if (!imageUrl) throw new Error('Gambar produk wajib diisi melalui upload atau Image URL.');

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: payload.name.trim(),
        description: payload.description.trim(),
        price: Number(payload.price),
        stock: Number(payload.stock),
        image_url: imageUrl,
        category: payload.category.trim(),
        featured: Boolean(payload.featured)
      })
      .select()
      .single();

    if (error) throw error;
    return toProduct(data);
  } catch (error) {
    throw new Error(reportError('db.products.create', error));
  }
}

export async function updateProduct(id, payload, imageFile) {
  try {
    ensureSupabase();
    const imageUrl = imageFile ? await uploadProductImage(imageFile) : payload.image_url;
    if (!imageUrl) throw new Error('Gambar produk wajib diisi melalui upload atau Image URL.');

    const { data, error } = await supabase
      .from('products')
      .update({
        name: payload.name.trim(),
        description: payload.description.trim(),
        price: Number(payload.price),
        stock: Number(payload.stock),
        image_url: imageUrl,
        category: payload.category.trim(),
        featured: Boolean(payload.featured)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toProduct(data);
  } catch (error) {
    throw new Error(reportError('db.products.update', error));
  }
}

export async function deleteProduct(id) {
  try {
    ensureSupabase();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    throw new Error(reportError('db.products.delete', error));
  }
}

export async function createOrder(userId, cartItems) {
  try {
    ensureSupabase();
    const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0) + 10000;
    const { data: order, error } = await supabase
      .from('orders')
      .insert({ user_id: userId, total, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    const items = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.qty,
      subtotal: item.price * item.qty
    }));

    const { error: itemError } = await supabase.from('order_items').insert(items);
    if (itemError) throw itemError;

    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Pesanan baru',
      message: `Order ${order.id.slice(0, 8)} menunggu konfirmasi.`,
      type: 'order'
    });

    return order;
  } catch (error) {
    throw new Error(reportError('db.orders.create', error));
  }
}

export async function getOrders(userId, role = 'customer') {
  try {
    ensureSupabase();
    let query = supabase
      .from('orders')
      .select('id, total, status, created_at, profiles(full_name), order_items(quantity, subtotal, products(name))')
      .order('created_at', { ascending: false });

    if (role !== 'admin') query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(toOrder);
  } catch (error) {
    throw new Error(reportError('db.orders.list', error));
  }
}

export async function getNotifications(role = 'customer') {
  try {
    ensureSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, created_at')
      .order('created_at', { ascending: false })
      .limit(role === 'admin' ? 20 : 8);

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(reportError('db.notifications.list', error));
  }
}

export async function getProfiles() {
  try {
    ensureSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(reportError('db.profiles.list', error));
  }
}

export async function updateProfile(userId, payload) {
  try {
    ensureSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: payload.full_name.trim(),
        avatar_url: payload.avatar_url || null
      })
      .eq('id', userId)
      .select('id, full_name, role, avatar_url, created_at')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.full_name,
      role: data.role,
      avatar_url: data.avatar_url
    };
  } catch (error) {
    throw new Error(reportError('db.profiles.update', error));
  }
}

export async function toggleWishlist(userId, productId) {
  try {
    ensureSupabase();
    const { data: existing, error: findError } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error } = await supabase.from('wishlist').delete().eq('id', existing.id);
      if (error) throw error;
      return false;
    }

    const { error } = await supabase.from('wishlist').insert({ user_id: userId, product_id: productId });
    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(reportError('db.wishlist.toggle', error));
  }
}

export async function getDashboardData() {
  const [products, orders, notifications, profiles] = await Promise.all([
    getProducts(),
    getOrders(undefined, 'admin'),
    getNotifications('admin'),
    getProfiles()
  ]);

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock <= 12);
  const customers = profiles.filter((profile) => profile.role === 'customer');

  return {
    products,
    orders,
    notifications,
    profiles,
    lowStock,
    stats: {
      totalSales,
      totalOrders: orders.length,
      totalProducts: products.length,
      customerCount: customers.length
    }
  };
}

export function subscribeDashboard(onChange) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('admin-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe();

  return () => supabase.removeChannel(channel);
}
