export const categories = [
  { id: 1, name: 'Keripik', slug: 'keripik', tone: 'bg-orange-100 text-orange-700' },
  { id: 2, name: 'Basreng', slug: 'basreng', tone: 'bg-rose-100 text-rose-700' },
  { id: 3, name: 'Manis', slug: 'manis', tone: 'bg-emerald-100 text-emerald-700' },
  { id: 4, name: 'Hampers', slug: 'hampers', tone: 'bg-indigo-100 text-indigo-700' }
];

export const products = [
  {
    id: 1,
    name: 'Keripik Singkong Balado',
    slug: 'keripik-singkong-balado',
    category: 'Keripik',
    price: 18000,
    discount: 10,
    stock: 84,
    rating: 4.8,
    sold: 942,
    image: 'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Keripik%20Singkong.png',
    description: 'Keripik singkong tipis dengan bumbu balado hangat, gurih, dan renyah tahan lama.',
    featured: true
  },
  {
    id: 2,
    name: 'Basreng Njabrik Level 3',
    slug: 'basreng-njabrik-level-3',
    category: 'Basreng',
    price: 22000,
    discount: 0,
    stock: 36,
    rating: 4.9,
    sold: 1204,
    image: 'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Basreng%20Level%203.png',
    description: 'Basreng pedas gurih dengan level favorit pelanggan dan aroma daun jeruk.',
    featured: true
  },
  {
    id: 3,
    name: 'Makaroni Keju Creamy',
    slug: 'makaroni-keju-creamy',
    category: 'Manis',
    price: 16000,
    discount: 5,
    stock: 12,
    rating: 4.7,
    sold: 628,
    image: 'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Makaroni%20Keju.png',
    description: 'Makaroni kriuk dengan taburan keju creamy premium dan rasa ringan.',
    featured: false
  },
  {
    id: 4,
    name: 'Hampers Cemilan Premium',
    slug: 'hampers-cemilan-premium',
    category: 'Hampers',
    price: 89000,
    discount: 12,
    stock: 8,
    rating: 4.9,
    sold: 226,
    image: 'https://raw.githubusercontent.com/ahmadfajarpermadi/nyemilnjabrik/master/Hampers.png',
    description: 'Paket cantik berisi snack best seller untuk hadiah, hampers kantor, dan acara keluarga.',
    featured: true
  }
];

export const revenueData = [
  { day: 'Sen', revenue: 1250000, orders: 22 },
  { day: 'Sel', revenue: 1680000, orders: 28 },
  { day: 'Rab', revenue: 1420000, orders: 25 },
  { day: 'Kam', revenue: 2140000, orders: 34 },
  { day: 'Jum', revenue: 2860000, orders: 41 },
  { day: 'Sab', revenue: 3370000, orders: 52 },
  { day: 'Min', revenue: 3040000, orders: 47 }
];

export const orders = [
  { id: 'NN-20260508-001', customer: 'Sari Dewi', product: 'Keripik + Basreng', total: 67000, status: 'dikirim', time: '08 Mei 2026, 10:12' },
  { id: 'NN-20260508-002', customer: 'Bima Pratama', product: 'Hampers Premium', total: 91000, status: 'diproses', time: '08 Mei 2026, 09:45' },
  { id: 'NN-20260507-118', customer: 'Maya Fitri', product: 'Makaroni Keju', total: 42000, status: 'selesai', time: '07 Mei 2026, 16:20' },
  { id: 'NN-20260507-117', customer: 'Reno Aji', product: 'Basreng Level 3', total: 54000, status: 'pending', time: '07 Mei 2026, 13:18' }
];

export const notifications = [
  { title: 'Pesanan baru', message: 'NN-20260508-002 menunggu konfirmasi.', type: 'order' },
  { title: 'Pembayaran masuk', message: 'Bukti transfer Sari berhasil diunggah.', type: 'payment' },
  { title: 'Stok menipis', message: 'Hampers Premium tersisa 8 pcs.', type: 'stock' },
  { title: 'Review baru', message: 'Basreng Njabrik mendapat rating 5.', type: 'review' }
];
