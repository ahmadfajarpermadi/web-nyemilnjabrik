import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  FiArrowRight,
  FiBarChart2,
  FiBell,
  FiBox,
  FiChevronUp,
  FiCreditCard,
  FiDownload,
  FiFilter,
  FiHeart,
  FiHome,
  FiLogIn,
  FiMenu,
  FiMoon,
  FiPackage,
  FiPlus,
  FiSearch,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
  FiSun,
  FiTruck,
  FiUpload,
  FiUser,
  FiUsers,
  FiX
} from 'react-icons/fi';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { categories, notifications as mockNotifications, orders as mockOrders, products as mockProducts, revenueData } from './data/mockData.js';
import { resetPassword, signInWithEmail, signOut, signUpWithEmail } from './lib/auth.js';
import { formatCurrency } from './lib/api.js';
import { getFriendlyError } from './lib/errors.js';
import { debugError, isSupabaseConfigured } from './lib/supabase.js';
import {
  createOrder,
  createProduct,
  deleteProduct,
  getDashboardData,
  getNotifications,
  getOrders,
  getProducts,
  subscribeDashboard,
  toggleWishlist,
  updateProfile,
  updateProduct
} from './lib/database.js';
import { useAuth } from './hooks/useAuth.js';

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28 }
};

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('nn_theme') || 'light');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('nn_cart') || '[]'));
  const [products, setProducts] = useState(isSupabaseConfigured ? [] : mockProducts);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const { user, setUser, loading: authLoading } = useAuth();
  const location = useLocation();
  useSeo(location.pathname);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nn_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('nn_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setProducts(mockProducts);
      setProductsError('Supabase belum dikonfigurasi. Menampilkan data demo lokal.');
      setProductsLoading(false);
      return () => {
        mounted = false;
      };
    }

    getProducts()
      .then((items) => {
        if (!mounted) return;
        setProducts(items);
        setProductsError('');
      })
      .catch((error) => {
        if (!mounted) return;
        debugError('products.bootstrap', error);
        setProducts([]);
        setProductsError(getFriendlyError(error, 'Produk gagal dimuat dari Supabase.'));
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addToCart = (product) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) return items.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
      return [...items, { ...product, qty: 1 }];
    });
    Swal.fire({ title: 'Masuk keranjang', text: product.name, icon: 'success', timer: 1200, showConfirmButton: false });
  };

  const updateQty = (id, qty) => {
    setCart((items) => items.map((item) => (item.id === id ? { ...item, qty: Math.max(1, qty) } : item)));
  };

  const removeCart = (id) => setCart((items) => items.filter((item) => item.id !== id));

  return (
    <AppShell cartCount={cart.reduce((sum, item) => sum + item.qty, 0)} theme={theme} setTheme={setTheme} user={user} setUser={setUser}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPage products={products} addToCart={addToCart} />} />
          <Route path="/shop" element={<ShopPage products={products} loading={productsLoading} error={productsError} addToCart={addToCart} />} />
          <Route path="/product/:slug" element={<ProductDetail products={products} loading={productsLoading} error={productsError} user={user} addToCart={addToCart} />} />
          <Route path="/cart" element={<CartPage cart={cart} updateQty={updateQty} removeCart={removeCart} />} />
          <Route path="/checkout" element={<CustomerGuard user={user} authLoading={authLoading}><CheckoutPage user={user} cart={cart} setCart={setCart} /></CustomerGuard>} />
          <Route path="/tracking/:id" element={<CustomerGuard user={user} authLoading={authLoading}><TrackingPage user={user} /></CustomerGuard>} />
          <Route path="/customer" element={<CustomerGuard user={user} authLoading={authLoading}><CustomerDashboard user={user} products={products} /></CustomerGuard>} />
          <Route path="/login" element={<AuthPage type="login" setUser={setUser} />} />
          <Route path="/register" element={<AuthPage type="register" setUser={setUser} />} />
          <Route path="/forgot-password" element={<AuthPage type="forgot" setUser={setUser} />} />
          <Route path="/admin/*" element={<AdminGuard user={user} authLoading={authLoading}><AdminDashboard products={products} setProducts={setProducts} /></AdminGuard>} />
        </Routes>
      </AnimatePresence>
      <FloatingActions />
    </AppShell>
  );
}

const seoByRoute = {
  '/': {
    title: 'Nyemil Njabrik | Snack UMKM Modern',
    description: 'Belanja cemilan Nyemil Njabrik dan pantau operasional UMKM lewat dashboard modern yang cepat, responsif, dan aman.'
  },
  '/shop': {
    title: 'Belanja Snack | Nyemil Njabrik',
    description: 'Pilih basreng, keripik, makaroni, dan hampers snack favorit dari Nyemil Njabrik.'
  },
  '/cart': {
    title: 'Keranjang Belanja | Nyemil Njabrik',
    description: 'Review pesanan snack Nyemil Njabrik sebelum checkout.'
  },
  '/checkout': {
    title: 'Checkout Aman | Nyemil Njabrik',
    description: 'Checkout pesanan cemilan Nyemil Njabrik dengan alur yang ringkas dan mobile-friendly.'
  },
  '/customer': {
    title: 'Dashboard Customer | Nyemil Njabrik',
    description: 'Pantau pesanan, wishlist, dan riwayat belanja pelanggan Nyemil Njabrik.'
  },
  '/admin': {
    title: 'Admin Dashboard | Nyemil Njabrik',
    description: 'Monitoring penjualan, stok, pelanggan, dan laporan bisnis Nyemil Njabrik.'
  }
};

function useSeo(pathname) {
  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
    const routeKey = pathname.startsWith('/product/') ? '/shop' : pathname.startsWith('/admin') ? '/admin' : pathname;
    const seo = seoByRoute[routeKey] || seoByRoute['/'];
    const canonical = `${baseUrl}${pathname === '/' ? '' : pathname}`;

    document.title = seo.title;
    setMeta('description', seo.description);
    setMeta('robots', 'index, follow');
    setMeta('og:title', seo.title, 'property');
    setMeta('og:description', seo.description, 'property');
    setMeta('og:url', canonical, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setCanonical(canonical);
  }, [pathname]);
}

function setMeta(name, content, attribute = 'name') {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function AppShell({ children, cartCount, theme, setTheme, user, setUser }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      Swal.fire('Logout gagal', error.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white text-brand-ink transition dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 font-poppins text-lg font-bold">
            <img
              src="/logo.png"
              alt="Nyemil Njabrik Logo"
              className="h-12 w-12 rounded-2xl object-cover shadow-soft"
            />
            <span>Nyemil Njabrik</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            <NavLink to="/shop">Belanja</NavLink>
            <NavLink to="/customer">Dashboard</NavLink>
            <NavLink to="/admin">Admin</NavLink>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle dark mode">
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <Link className="icon-btn relative" to="/cart" aria-label="Keranjang">
              <FiShoppingCart />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-orange px-1 text-xs text-white">{cartCount}</span>}
            </Link>
            {user ? (
              <button className="btn-ghost" onClick={logout}>{user.name}</button>
            ) : (
              <Link className="btn-primary" to="/login"><FiLogIn /> Login</Link>
            )}
          </div>
          <button className="icon-btn md:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><FiMenu /></button>
        </nav>
      </header>
      <MobileMenu open={open} setOpen={setOpen} cartCount={cartCount} theme={theme} setTheme={setTheme} />
      <main>{children}</main>
    </div>
  );
}

function MobileMenu({ open, setOpen, cartCount, theme, setTheme }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.aside className="ml-auto h-full w-80 max-w-[86vw] bg-white p-5 shadow-soft dark:bg-slate-900" initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}>
            <div className="flex items-center justify-between">
              <span className="font-poppins font-bold">Menu</span>
              <button className="icon-btn" onClick={() => setOpen(false)}><FiX /></button>
            </div>
            <div className="mt-8 grid gap-3" onClick={() => setOpen(false)}>
              <MobileNav to="/" icon={<FiHome />} label="Landing" />
              <MobileNav to="/shop" icon={<FiShoppingBag />} label="Belanja Produk" />
              <MobileNav to="/cart" icon={<FiShoppingCart />} label={`Keranjang (${cartCount})`} />
              <MobileNav to="/customer" icon={<FiUser />} label="Customer Dashboard" />
              <MobileNav to="/admin" icon={<FiBarChart2 />} label="Admin Dashboard" />
              <MobileNav to="/login" icon={<FiLogIn />} label="Login" />
            </div>
            <button className="mt-6 w-full btn-secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />} Ganti Mode
            </button>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavLink({ to, children }) {
  return <Link to={to} className="text-sm font-semibold text-slate-600 transition hover:text-brand-orange dark:text-slate-300">{children}</Link>;
}

function MobileNav({ to, icon, label }) {
  return <Link to={to} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 font-semibold dark:bg-slate-800">{icon}{label}</Link>;
}

function LandingPage({ products, addToCart }) {
  return (
    <motion.div {...pageMotion}>
      <section className="relative overflow-hidden bg-brand-cream dark:bg-slate-950">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent dark:from-slate-950" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-20">
          <div className="relative z-10">
            <span className="pill">UMKM snack modern dari dapur lokal</span>
            <h1 className="mt-5 max-w-3xl font-poppins text-4xl font-extrabold leading-tight tracking-normal text-brand-ink sm:text-5xl lg:text-6xl dark:text-white">
              Nyemil Njabrik
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Belanja cemilan renyah, pedas, dan premium dengan pengalaman e-commerce yang rapi, cepat, dan nyaman dari layar kecil sampai dashboard bisnis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" to="/shop">Mulai Belanja <FiArrowRight /></Link>
              <Link className="btn-secondary" to="/admin">Lihat Dashboard</Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-xl">
              <Stat number="12K+" label="Snack terjual" />
              <Stat number="4.9" label="Rating toko" />
              <Stat number="98%" label="Repeat order" />
            </div>
          </div>
          <motion.div className="relative z-10" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="hero-visual">
              <img src="https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Basreng%20Level%203.png" alt="Produk cemilan premium Nyemil Njabrik" />
              <div className="hero-card glass">
                <span className="text-xs font-semibold text-slate-500">Best seller hari ini</span>
                <strong>Basreng Njabrik Level 3</strong>
                <span className="text-brand-orange">+312 order minggu ini</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section eyebrow="Promo" title="Paket hemat yang mudah dipilih">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <PromoBanner />
          <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-soft">
            <FiTruck className="text-3xl text-brand-orange" />
            <h3 className="mt-5 font-poppins text-2xl font-bold">Gratis ongkir area tertentu</h3>
            <p className="mt-3 text-slate-300">Checkout lebih ringan untuk repeat customer dan paket bundling.</p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Produk Unggulan" title="Cemilan favorit pelanggan">
        <ProductGrid items={products.filter((item) => item.featured)} addToCart={addToCart} />
      </Section>

      <Section eyebrow="UCD" title="Dibuat untuk pembeli dan admin">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Flow cepat', 'Cari produk, tambah keranjang, checkout, dan tracking tanpa kebingungan.', <FiSearch />],
            ['Mobile-first', 'Card, tombol, dan form tetap nyaman untuk satu tangan.', <FiShoppingBag />],
            ['Admin efisien', 'Monitoring order, stok, dan laporan disatukan dalam dashboard.', <FiBarChart2 />],
            ['Aksesibel', 'Kontras baik, label jelas, dan navigasi keyboard-friendly.', <FiUser />]
          ].map(([title, text, icon]) => <FeatureCard key={title} title={title} text={text} icon={icon} />)}
        </div>
      </Section>

      <Testimonials />
      <FAQ />
      <Footer />
    </motion.div>
  );
}

function ShopPage({ products, loading, error, addToCart }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');

  const filtered = products.filter((item) => {
    const matchQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const matchCategory = category === 'Semua' || item.category === category;
    return matchQuery && matchCategory;
  });

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="pill">Katalog Snack</span>
            <h1 className="mt-4 font-poppins text-3xl font-bold sm:text-4xl">Belanja cemilan favorit</h1>
          </div>
          <div className="search-box">
            <FiSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari basreng, keripik, hampers..." />
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {['Semua', ...categories.map((item) => item.name)].map((item) => (
            <button key={item} className={`chip ${category === item ? 'chip-active' : ''}`} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>

        <div className="mt-8">
          {error && <InlineAlert title="Produk belum tersedia" text={error} />}
          {loading ? <SkeletonGrid /> : filtered.length ? <ProductGrid items={filtered} addToCart={addToCart} /> : <EmptyState title="Produk tidak ditemukan" text="Coba kata kunci atau kategori lain." />}
        </div>
      </div>
    </motion.div>
  );
}

function ProductDetail({ products, loading, error, user, addToCart }) {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug) || products[0] || (!isSupabaseConfigured ? mockProducts[0] : null);
  if (loading) return <div className="page px-4 py-10"><SkeletonGrid /></div>;
  if (!product) return <div className="page px-4 py-10"><EmptyState title="Produk tidak tersedia" text={error || 'Produk belum tersedia di Supabase.'} /></div>;
  const related = products.filter((item) => item.category === product.category && item.id !== product.id);

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('nn_recently_viewed') || '[]').filter((item) => item.id !== product.id);
    localStorage.setItem('nn_recently_viewed', JSON.stringify([product, ...viewed].slice(0, 4)));
  }, [product]);

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <div className="product-gallery">
          <img src={product.image} alt={product.name} />
        </div>
        <div>
          <span className="pill">{product.category}</span>
          <h1 className="mt-4 font-poppins text-3xl font-bold sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-amber-500"><FiStar /> {product.rating}</span>
            <span>{product.sold} terjual</span>
            <span>Stok {product.stock}</span>
          </div>
          <p className="mt-6 text-3xl font-extrabold text-brand-orange">{formatCurrency(product.price)}</p>
          <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">{product.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" onClick={() => addToCart(product)}><FiShoppingCart /> Tambah Keranjang</button>
            <button
              className="btn-secondary"
              onClick={async () => {
                if (!user) {
                  Swal.fire('Login diperlukan', 'Masuk dulu untuk menyimpan wishlist.', 'info');
                  return;
                }
                try {
                  const saved = await toggleWishlist(user.id, product.id);
                  Swal.fire(saved ? 'Disimpan' : 'Dihapus', saved ? 'Produk masuk wishlist.' : 'Produk dihapus dari wishlist.', 'success');
                } catch (error) {
                  Swal.fire('Wishlist gagal', error.message, 'error');
                }
              }}
            >
              <FiHeart /> Wishlist
            </button>
          </div>
          <div className="mt-8 rounded-3xl bg-slate-50 p-5 dark:bg-slate-900">
            <h3 className="font-bold">Review pelanggan</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">"Rasanya konsisten, packing rapi, dan cocok untuk stok cemilan di rumah."</p>
          </div>
        </div>
      </div>
      <Section eyebrow="Rekomendasi" title="Produk terkait">
        <ProductGrid items={related.length ? related : products.slice(0, 3)} addToCart={addToCart} />
      </Section>
    </motion.div>
  );
}

function CartPage({ cart, updateQty, removeCart }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = subtotal > 100000 ? 10000 : 0;
  const shipping = cart.length ? 10000 : 0;
  const total = subtotal - discount + shipping;

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <h1 className="font-poppins text-3xl font-bold">Keranjang</h1>
          <div className="mt-6 grid gap-4">
            {cart.length ? cart.map((item) => (
              <div key={item.id} className="cart-row">
                <img src={item.image} alt={item.name} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-brand-orange">{formatCurrency(item.price)}</p>
                </div>
                <input className="qty-input" type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.id, Number(e.target.value))} />
                <button className="icon-btn" onClick={() => removeCart(item.id)}><FiX /></button>
              </div>
            )) : <EmptyState title="Keranjang kosong" text="Pilih snack favorit dulu untuk mulai checkout." />}
          </div>
        </div>
        <OrderSummary subtotal={subtotal} discount={discount} shipping={shipping} total={total} />
      </div>
    </motion.div>
  );
}

function CheckoutPage({ user, cart, setCart }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0) + (cart.length ? 10000 : 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!cart.length) return;

    setSubmitting(true);
    try {
      const order = await createOrder(user.id, cart);
      setCart([]);
      Swal.fire({ title: 'Pesanan dibuat', text: 'Pembayaran menunggu verifikasi admin.', icon: 'success' });
      navigate(`/tracking/${order.id}`);
    } catch (error) {
      Swal.fire('Checkout gagal', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <form className="form-panel" onSubmit={submit}>
          <h1 className="font-poppins text-3xl font-bold">Checkout</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Nama penerima" placeholder="Nama lengkap" required />
            <Field label="No. WhatsApp" placeholder="08xxxxxxxxxx" required />
            <Field className="sm:col-span-2" label="Alamat lengkap" placeholder="Jalan, nomor rumah, kecamatan, kota" required />
            <label className="field">
              <span>Metode pembayaran</span>
              <select required>
                <option>Bank Transfer</option>
                <option>E-Wallet</option>
                <option>COD</option>
              </select>
            </label>
            <label className="field upload-zone">
              <FiUpload />
              <span>Upload bukti pembayaran</span>
              <input type="file" accept="image/*" />
            </label>
          </div>
          <button className="mt-6 btn-primary" disabled={!cart.length || submitting}>
            {submitting ? 'Memproses...' : 'Buat Pesanan'}
          </button>
        </form>
        <aside className="summary-card">
          <h2 className="font-bold">Ringkasan pesanan</h2>
          <div className="mt-4 grid gap-3">
            {cart.map((item) => <div key={item.id} className="flex justify-between text-sm"><span>{item.name} x{item.qty}</span><span>{formatCurrency(item.price * item.qty)}</span></div>)}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 text-xl font-bold dark:border-slate-800">Total {formatCurrency(total)}</div>
        </aside>
      </div>
    </motion.div>
  );
}

function TrackingPage({ user }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const steps = ['pending', 'diproses', 'dikirim', 'selesai'];
  const active = Math.max(0, steps.indexOf(order?.status || 'pending'));

  useEffect(() => {
    getOrders(user.id, user.role)
      .then((items) => setOrder(items.find((item) => item.id === id) || null))
      .catch((error) => console.warn(error.message));
  }, [id, user]);

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <span className="pill">Order Tracking</span>
        <h1 className="mt-4 font-poppins text-3xl font-bold">
          {order ? `Pesanan ${order.status}` : 'Pesanan sedang diproses'}
        </h1>
        <div className="mt-10 rounded-[28px] bg-white p-6 shadow-soft dark:bg-slate-900">
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="relative">
                <div className={`timeline-dot ${index <= active ? 'timeline-active' : ''}`}>{index + 1}</div>
                <h3 className="mt-4 font-bold capitalize">{step}</h3>
                <p className="mt-2 text-sm text-slate-500">{index <= active ? 'Sudah diproses' : 'Menunggu tahap sebelumnya'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CustomerDashboard({ user, products }) {
  const recent = JSON.parse(localStorage.getItem('nn_recently_viewed') || '[]');
  const [orders, setOrders] = useState(mockOrders);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([getOrders(user.id, user.role), getNotifications(user.role)])
      .then(([orderItems, notificationItems]) => {
        setOrders(orderItems);
        setNotifications(notificationItems);
      })
      .catch((error) => console.warn(error.message));
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await updateProfile(user.id, { full_name: profileName, avatar_url: avatarUrl });
      Swal.fire('Profil tersimpan', 'Data pelanggan berhasil diperbarui.', 'success');
    } catch (error) {
      Swal.fire('Profil gagal disimpan', error.message, 'error');
    }
  };

  return (
    <motion.div className="page" {...pageMotion}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="dashboard-head">
          <div>
            <span className="pill">Customer Area</span>
            <h1 className="mt-4 font-poppins text-3xl font-bold">Halo, {user?.name || 'Pelanggan'}</h1>
          </div>
          <Link className="btn-primary" to="/shop"><FiShoppingBag /> Belanja Lagi</Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric title="Pesanan" value={orders.length} icon={<FiPackage />} />
          <Metric title="Wishlist" value="Realtime" icon={<FiHeart />} />
          <Metric title="Voucher" value="2" icon={<FiCreditCard />} />
          <Metric title="Notifikasi" value={notifications.length} icon={<FiBell />} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <Panel title="Riwayat pesanan">
            <OrderList orders={orders} compact />
          </Panel>
          <Panel title="Recently viewed">
            <div className="grid gap-3">
              {(recent.length ? recent : products.slice(0, 3)).map((item) => <MiniProduct key={item.id} item={item} />)}
            </div>
          </Panel>
        </div>
        <div className="mt-8">
          <Panel title="Profil pelanggan">
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={saveProfile}>
              <Field label="Nama lengkap" value={profileName} onChange={(event) => setProfileName(event.target.value)} required />
              <Field label="Avatar URL" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." />
              <button className="btn-primary self-end">Simpan</button>
            </form>
          </Panel>
        </div>
      </div>
    </motion.div>
  );
}

function AuthPage({ type, setUser }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const isLogin = type === 'login';
  const isForgot = type === 'forgot';

  const submit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password?.value;
    const fullName = form.full_name?.value;

    setSubmitting(true);
    try {
      if (isForgot) {
        await resetPassword(email);
        Swal.fire('Terkirim', 'Instruksi reset password akan dikirim jika email terdaftar.', 'success');
        return;
      }

      const profile = isLogin
        ? await signInWithEmail(email, password)
        : await signUpWithEmail({ email, password, fullName });

      if (profile.needsEmailConfirmation) {
        Swal.fire('Cek email Anda', 'Akun berhasil dibuat. Konfirmasi email dulu sebelum login.', 'success');
        navigate('/login');
        return;
      }

      setUser(profile);
      Swal.fire({
        title: isLogin ? 'Login berhasil' : 'Akun siap digunakan',
        text: `Selamat datang, ${profile.name}.`,
        icon: 'success',
        timer: 1300,
        showConfirmButton: false
      });
      navigate(profile.role === 'admin' ? '/admin' : '/customer');
    } catch (error) {
      Swal.fire('Autentikasi gagal', error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

return (
  <motion.div
    className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
    style={{
    backgroundImage: `url("https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Hampers.png")`,
    }}
  >

    {/* Overlay */}
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

    {/* Login Card */}
<form
  className="auth-card relative z-10 border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80"
  onSubmit={submit}
>
      <span className="pill">
        {isForgot
          ? 'Reset Password'
          : isLogin
          ? 'Welcome back'
          : 'Buat Akun'}
      </span>

      <h1 className="mt-4 font-poppins text-3xl font-bold text-slate-800 dark:text-white">
        {isForgot
          ? 'Pulihkan akses akun'
          : isLogin
          ? 'Login Nyemil Njabrik'
          : 'Daftar pelanggan baru'}
      </h1>

      <div className="mt-6 grid gap-4">
        {!isLogin && !isForgot && (
          <Field
            name="full_name"
            label="Nama lengkap"
            placeholder="Nama Anda"
            required
          />
        )}

        <Field
          name="email"
          label="Email"
          type="email"
          placeholder="nama@email.com"
          required
        />

        {!isForgot && (
          <Field
            name="password"
            label="Password"
            type="password"
            placeholder="Minimal 8 karakter"
            required
          />
        )}
      </div>

      {isLogin && (
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" />
          Remember me
        </label>
      )}

      <button className="mt-6 w-full btn-primary" disabled={submitting}>
        {submitting
          ? 'Memproses...'
          : isForgot
          ? 'Kirim Instruksi'
          : isLogin
          ? 'Login'
          : 'Register'}
      </button>

<div className="mt-5 flex justify-between text-sm text-slate-600 dark:text-slate-300">
  <Link
    to="/forgot-password"
    className="transition hover:text-orange-500"
  >
    Forgot password
  </Link>

  <Link
    to={isLogin ? '/register' : '/login'}
    className="transition hover:text-orange-500"
  >
    {isLogin ? 'Register' : 'Login'}
  </Link>
</div>
    </form>
  </motion.div>
);
}

function LoadingRoute() {
  return <div className="grid min-h-[60vh] place-items-center text-slate-500">Memuat sesi...</div>;
}

function CustomerGuard({ user, authLoading, children }) {
  if (authLoading) return <LoadingRoute />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminGuard({ user, authLoading, children }) {
  if (authLoading) return <LoadingRoute />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/customer" replace />;
  return children;
}

function AdminDashboard({ products, setProducts }) {
  const [tab, setTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboard, setDashboard] = useState({
    products,
    orders: mockOrders,
    notifications: mockNotifications,
    profiles: [],
    lowStock: products.filter((item) => item.stock <= 12),
    stats: {
      totalSales: mockOrders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: mockOrders.length,
      totalProducts: products.length,
      customerCount: 0
    }
  });

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      if (!isSupabaseConfigured) {
        setDashboardLoading(false);
        setDashboardError('Supabase belum dikonfigurasi. Dashboard memakai data demo lokal.');
        return;
      }

      getDashboardData()
        .then((data) => {
          if (!mounted) return;
          setDashboard(data);
          setProducts(data.products);
          setDashboardError('');
        })
        .catch((error) => {
          if (!mounted) return;
          debugError('dashboard.refresh', error);
          setDashboardError(getFriendlyError(error, 'Dashboard gagal memuat data Supabase.'));
        })
        .finally(() => {
          if (mounted) setDashboardLoading(false);
        });
    };

    refresh();
    const unsubscribe = subscribeDashboard(refresh);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setProducts]);

  return (
    <motion.div className="admin-shell" {...pageMotion}>
      <aside className={`admin-sidebar ${collapsed ? 'admin-sidebar-collapsed' : ''}`}>
        <button className="icon-btn mb-4" onClick={() => setCollapsed(!collapsed)}><FiMenu /></button>
        {[
          ['dashboard', 'Dashboard', <FiBarChart2 />],
          ['orders', 'Pesanan', <FiPackage />],
          ['products', 'Produk', <FiBox />],
          ['stock', 'Stok', <FiFilter />],
          ['customers', 'Customer', <FiUsers />],
          ['notifications', 'Notifikasi', <FiBell />],
          ['reports', 'Laporan', <FiDownload />]
        ].map(([key, label, icon]) => (
          <button key={key} className={`admin-nav ${tab === key ? 'admin-nav-active' : ''}`} onClick={() => setTab(key)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </aside>
      <section className="min-w-0 flex-1">
        <AdminTopbar />
        <div className="p-4 sm:p-6 lg:p-8">
          {dashboardError && <InlineAlert title="Dashboard perlu perhatian" text={dashboardError} />}
          {dashboardLoading && <div className="mb-5 text-sm font-semibold text-slate-500">Memuat dashboard realtime...</div>}
          {tab === 'dashboard' && <AdminOverview dashboard={dashboard} />}
          {tab === 'orders' && <OrdersAdmin orders={dashboard.orders} />}
          {tab === 'products' && <ProductsAdmin products={dashboard.products} setProducts={setProducts} onProductsChange={(items) => setDashboard((current) => ({ ...current, products: items, lowStock: items.filter((item) => item.stock <= 12), stats: { ...current.stats, totalProducts: items.length } }))} />}
          {tab === 'stock' && <StockAdmin products={dashboard.products} />}
          {tab === 'customers' && <CustomersAdmin profiles={dashboard.profiles} orders={dashboard.orders} />}
          {tab === 'notifications' && <NotificationsAdmin notifications={dashboard.notifications} />}
          {tab === 'reports' && <ReportsAdmin />}
        </div>
      </section>
    </motion.div>
  );
}

function AdminTopbar() {
  return (
    <div className="admin-topbar">
      <div className="search-box max-w-md">
        <FiSearch />
        <input placeholder="Cari pesanan, produk, pelanggan..." />
      </div>
      <div className="flex items-center gap-2">
        <button className="icon-btn"><FiBell /></button>
        <div className="hidden rounded-2xl bg-white px-4 py-2 text-sm font-semibold shadow-sm dark:bg-slate-900 sm:block">Admin Nyemil</div>
      </div>
    </div>
  );
}

function AdminOverview({ dashboard }) {
  const { stats, orders, notifications } = dashboard;

  return (
    <div>
      <div className="dashboard-head">
        <div>
          <span className="pill">Admin Dashboard</span>
          <h1 className="mt-4 font-poppins text-3xl font-bold">Monitoring penjualan real-time</h1>
        </div>
        <button className="btn-primary"><FiDownload /> Export Laporan</button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total Penjualan" value={formatCurrency(stats.totalSales)} icon={<FiCreditCard />} trend="live" />
        <Metric title="Total Pesanan" value={stats.totalOrders} icon={<FiPackage />} trend="live" />
        <Metric title="Total Produk" value={stats.totalProducts} icon={<FiShoppingBag />} trend="live" />
        <Metric title="Pelanggan" value={stats.customerCount} icon={<FiUsers />} trend="live" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <Panel title="Revenue harian">
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A00" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#FF8A00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area dataKey="revenue" stroke="#FF8A00" fill="url(#revenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Kategori terlaris">
          <div className="h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: 'Basreng', value: 42 }, { name: 'Keripik', value: 31 }, { name: 'Manis', value: 18 }, { name: 'Hampers', value: 9 }]} dataKey="value" innerRadius={58} outerRadius={98}>
                  {['#FF8A00', '#16A34A', '#E11D48', '#4F46E5'].map((color) => <Cell key={color} fill={color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <Panel title="Recent order"><OrderList orders={orders} /></Panel>
        <Panel title="Aktivitas terbaru"><NotificationList notifications={notifications} /></Panel>
      </div>
    </div>
  );
}

function OrdersAdmin({ orders }) {
  const [status, setStatus] = useState('semua');
  const filtered = status === 'semua' ? orders : orders.filter((order) => order.status === status);
  return (
    <Panel title="Monitoring pesanan">
      <div className="table-toolbar">
        <div className="search-box"><FiSearch /><input placeholder="Cari order ID atau pelanggan" /></div>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="semua">Semua status</option>
          <option value="pending">Pending</option>
          <option value="diproses">Diproses</option>
          <option value="dikirim">Dikirim</option>
          <option value="selesai">Selesai</option>
        </select>
        <button className="btn-secondary"><FiDownload /> PDF</button>
        <button className="btn-secondary"><FiDownload /> Excel</button>
      </div>
      <DataTable rows={filtered} />
    </Panel>
  );
}

function ProductsAdmin({ products, setProducts, onProductsChange }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      name: form.name.value,
      description: form.description.value,
      price: form.price.value,
      stock: form.stock.value,
      category: form.category.value,
      image_url: form.image_url.value,
      featured: form.featured.checked
    };
    const imageFile = form.image.files?.[0];

    setSaving(true);
    try {
      const product = editing
        ? await updateProduct(editing.id, payload, imageFile)
        : await createProduct(payload, imageFile);

      const nextProducts = editing ? products.map((item) => item.id === product.id ? product : item) : [product, ...products];
      setProducts(nextProducts);
      onProductsChange?.(nextProducts);
      setEditing(null);
      setImagePreview('');
      form.reset();
      Swal.fire('Tersimpan', 'Produk berhasil disinkronkan ke Supabase.', 'success');
    } catch (error) {
      Swal.fire('Gagal menyimpan', error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product) => {
    const result = await Swal.fire({
      title: 'Hapus produk?',
      text: product.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await deleteProduct(product.id);
      const nextProducts = products.filter((item) => item.id !== product.id);
      setProducts(nextProducts);
      onProductsChange?.(nextProducts);
      Swal.fire('Dihapus', 'Produk berhasil dihapus.', 'success');
    } catch (error) {
      Swal.fire('Gagal menghapus', error.message, 'error');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Panel title={editing ? 'Edit produk' : 'Tambah produk'}>
        <form key={editing?.id || 'new-product'} className="grid gap-4" onSubmit={submit}>
          <Field name="name" label="Nama produk" placeholder="Contoh: Basreng Njabrik Level 5" defaultValue={editing?.name || ''} required />
          <Field name="description" label="Deskripsi" placeholder="Deskripsi singkat produk" defaultValue={editing?.description || ''} required />
          <Field name="price" label="Harga" type="number" min="0" placeholder="22000" defaultValue={editing?.price || ''} required />
          <Field name="stock" label="Stok" type="number" min="0" placeholder="40" defaultValue={editing?.stock || ''} required />
          <Field name="category" label="Kategori" placeholder="Basreng" defaultValue={editing?.category || ''} required />
          <Field name="image_url" label="Image URL fallback" placeholder="https://..." defaultValue={editing?.image_url || editing?.image || ''} />
          <label className="field upload-zone">
            {imagePreview || editing?.image ? <img src={imagePreview || editing.image} alt="Preview produk" className="h-24 w-24 rounded-2xl object-cover" /> : <FiUpload />}
            <span>Upload gambar produk</span>
            <input
              name="image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setImagePreview(file ? URL.createObjectURL(file) : '');
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <input name="featured" type="checkbox" defaultChecked={editing?.featured || false} />
            Featured product
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={saving}><FiPlus /> {saving ? 'Menyimpan...' : 'Simpan Produk'}</button>
            {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setImagePreview(''); }}>Batal</button>}
          </div>
        </form>
      </Panel>
      <Panel title="Daftar produk">
        <div className="grid gap-3">
          {products.map((item) => <MiniProduct key={item.id} item={item} admin onEdit={setEditing} onDelete={remove} />)}
        </div>
      </Panel>
    </div>
  );
}

function StockAdmin({ products }) {
  return (
    <Panel title="Manajemen stok">
      <div className="grid gap-3">
        {products.map((item) => {
          const state = item.stock === 0 ? 'habis' : item.stock <= 12 ? 'menipis' : 'aman';
          return (
            <div key={item.id} className="stock-row">
              <div>
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-slate-500">Minimum stok 12 pcs</p>
              </div>
              <span className={`stock-badge stock-${state}`}>{state}</span>
              <strong>{item.stock} pcs</strong>
              <button className="btn-secondary"><FiPlus /> Tambah stok</button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function CustomersAdmin({ profiles, orders }) {
  const customers = profiles
    .filter((profile) => profile.role === 'customer')
    .map((profile) => {
      const customerOrders = orders.filter((order) => order.customer === profile.full_name);
      const total = customerOrders.reduce((sum, order) => sum + order.total, 0);
      return [profile.full_name, profile.id.slice(0, 8), `${customerOrders.length} transaksi`, formatCurrency(total), 'active'];
    });

  return (
    <Panel title="Customer management">
      <div className="responsive-table">
        <table>
          <thead><tr><th>Pelanggan</th><th>Email</th><th>Total transaksi</th><th>Total belanja</th><th>Status</th></tr></thead>
          <tbody>{customers.map((row) => <tr key={row[1]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </Panel>
  );
}

function NotificationsAdmin({ notifications }) {
  return <Panel title="Notification center"><NotificationList notifications={notifications} /></Panel>;
}

function ReportsAdmin() {
  return (
    <Panel title="Laporan penjualan">
      <div className="table-toolbar">
        <Field label="Dari tanggal" type="date" />
        <Field label="Sampai tanggal" type="date" />
        <button className="btn-secondary"><FiDownload /> Export PDF</button>
        <button className="btn-secondary"><FiDownload /> Export Excel</button>
      </div>
      <div className="mt-6 h-80">
        <ResponsiveContainer>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="orders" fill="#16A34A" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function ProductGrid({ items, addToCart }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((product, index) => <ProductCard key={product.id} product={product} addToCart={addToCart} index={index} />)}
    </div>
  );
}

function ProductCard({ product, addToCart, index }) {
  return (
    <motion.article className="product-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}>
      <Link to={`/product/${product.slug}`} className="block">
        <div className="product-img"><img src={product.image} alt={product.name} loading="lazy" /></div>
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{product.category}</span>
            <span className="flex items-center gap-1 text-amber-500"><FiStar /> {product.rating}</span>
          </div>
          <h3 className="mt-2 min-h-[48px] font-poppins font-bold">{product.name}</h3>
          <div className="mt-3 flex items-center justify-between">
            <strong className="text-brand-orange">{formatCurrency(product.price)}</strong>
            {product.discount > 0 && <span className="discount-badge">-{product.discount}%</span>}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button className="w-full btn-primary" onClick={() => addToCart(product)}><FiShoppingCart /> Tambah</button>
      </div>
    </motion.article>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="pill">{eyebrow}</span>
      <h2 className="mt-4 max-w-3xl font-poppins text-3xl font-bold sm:text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function PromoBanner() {
  return (
    <div className="promo-banner">
      <div>
        <span className="pill bg-white/80">Promo Mingguan</span>
        <h3 className="mt-5 font-poppins text-3xl font-bold dark:text-black">Bundling cemilan mulai Rp49 ribu</h3>
        <p className="mt-3 max-w-xl text-slate-700">Paket keripik, basreng, dan makaroni untuk stok mingguan rumah atau kantor.</p>
      </div>
      <Link className="btn-primary self-start" to="/shop">Cek Promo</Link>
    </div>
  );
}

function Stat({ number, label }) {
  return <div className="rounded-3xl bg-white/80 p-4 shadow-sm backdrop-blur dark:bg-slate-900/80"><strong className="block text-2xl text-brand-orange">{number}</strong><span className="text-sm text-slate-500">{label}</span></div>;
}

function FeatureCard({ title, text, icon }) {
  return <div className="feature-card"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;
}

function Testimonials() {
  return (
    <Section eyebrow="Testimoni" title="Dipilih karena rasa dan pengalaman">
      <div className="grid gap-4 md:grid-cols-3">
        {['Packing rapi, snack sampai tetap renyah.', 'Dashboard adminnya enak untuk pantau order harian.', 'Rasa pedasnya pas, repeat order terus.'].map((text, index) => (
          <div key={text} className="rounded-[28px] bg-white p-6 shadow-soft dark:bg-slate-900">
            <div className="flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <FiStar key={i} />)}</div>
            <p className="mt-4 text-slate-600 dark:text-slate-300">"{text}"</p>
            <strong className="mt-5 block">Pelanggan {index + 1}</strong>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FAQ() {
  return (
    <Section eyebrow="FAQ" title="Pertanyaan yang sering muncul">
      <div className="grid gap-3">
        {[
          ['Apakah bisa kirim luar kota?', 'Bisa. Ongkir dihitung saat checkout sesuai alamat.'],
          ['Bagaimana cara tracking pesanan?', 'Setiap order memiliki timeline status pending, diproses, dikirim, dan selesai.'],
          ['Apakah admin bisa export laporan?', 'Bisa. UI laporan sudah menyediakan export PDF dan Excel.']
        ].map(([q, a]) => <details key={q} className="faq-item"><summary>{q}</summary><p>{a}</p></details>)}
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-poppins text-2xl font-bold">Nyemil Njabrik</h3>
          <p className="mt-3 max-w-md text-slate-500">UMKM cemilan dengan pengalaman belanja modern dan monitoring bisnis yang rapi.</p>
        </div>
        <div><strong>Menu</strong><div className="mt-3 grid gap-2 text-slate-500"><Link to="/shop">Belanja</Link><Link to="/customer">Customer</Link><Link to="/admin">Admin</Link></div></div>
        <div><strong>Sosial</strong><div className="mt-3 grid gap-2 text-slate-500"><span>Instagram</span><span>TikTok</span><span>WhatsApp</span></div></div>
      </div>
    </footer>
  );
}

function OrderSummary({ subtotal, discount, shipping, total }) {
  return (
    <aside className="summary-card">
      <h2 className="font-poppins text-xl font-bold">Ringkasan</h2>
      <div className="mt-5 grid gap-3 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between"><span>Voucher</span><span>-{formatCurrency(discount)}</span></div>
        <div className="flex justify-between"><span>Estimasi ongkir</span><span>{formatCurrency(shipping)}</span></div>
      </div>
      <div className="mt-5 flex justify-between border-t border-slate-200 pt-5 text-xl font-bold dark:border-slate-800"><span>Total</span><span>{formatCurrency(total)}</span></div>
      <Link className={`mt-6 w-full btn-primary ${!subtotal ? 'pointer-events-none opacity-50' : ''}`} to="/checkout">Checkout</Link>
    </aside>
  );
}

function Metric({ title, value, icon, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
      {trend && <em>{trend}</em>}
    </div>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2><div className="mt-5">{children}</div></section>;
}

function OrderList({ orders = mockOrders, compact }) {
  return <div className="grid gap-3">{orders.slice(0, compact ? 3 : 4).map((order) => <div key={order.id} className="order-item"><div><strong>{String(order.id).slice(0, 8)}</strong><p>{order.customer} - {order.product}</p></div><span className={`status status-${order.status}`}>{order.status}</span><strong>{formatCurrency(order.total)}</strong></div>)}</div>;
}

function DataTable({ rows }) {
  return (
    <div className="responsive-table">
      <table>
        <thead><tr><th>Order ID</th><th>Pelanggan</th><th>Produk</th><th>Total</th><th>Status</th><th>Waktu</th><th>Aksi</th></tr></thead>
        <tbody>
          {rows.map((order) => (
            <tr key={order.id}>
              <td>{String(order.id).slice(0, 8)}</td><td>{order.customer}</td><td>{order.product}</td><td>{formatCurrency(order.total)}</td><td><span className={`status status-${order.status}`}>{order.status}</span></td><td>{order.time}</td><td><button className="btn-mini">Update</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end gap-2"><button className="btn-mini">Prev</button><button className="btn-mini">1</button><button className="btn-mini">Next</button></div>
    </div>
  );
}

function NotificationList({ notifications = mockNotifications }) {
  return <div className="grid gap-3">{notifications.map((item) => <div key={item.id || item.title} className="notification-item"><span><FiBell /></span><div><strong>{item.title}</strong><p>{item.message}</p></div></div>)}</div>;
}

function MiniProduct({ item, admin, onEdit, onDelete }) {
  return (
    <div className="mini-product">
      <img src={item.image || item.image_url} alt={item.name} />
      <div className="min-w-0 flex-1">
        <strong>{item.name}</strong>
        <p>{item.category} - {formatCurrency(item.price)}</p>
      </div>
      {admin ? (
        <div className="flex gap-2">
          <button className="btn-mini" onClick={() => onEdit?.(item)}>Edit</button>
          <button className="btn-mini" onClick={() => onDelete?.(item)}>Hapus</button>
        </div>
      ) : <Link className="btn-mini" to={`/product/${item.slug}`}>Lihat</Link>}
    </div>
  );
}

function Field({ label, className = '', ...props }) {
  return <label className={`field ${className}`}><span>{label}</span><input {...props} /></label>;
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><FiShoppingBag /><h3>{title}</h3><p>{text}</p></div>;
}

function InlineAlert({ title, text }) {
  return (
    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <strong>{title}</strong>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}

function SkeletonGrid() {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}</div>;
}

function FloatingActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 grid gap-2">
      <Link className="fab" to="/cart"><FiShoppingCart /></Link>
      <button className="fab" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><FiChevronUp /></button>
    </div>
  );
}

export default App;
