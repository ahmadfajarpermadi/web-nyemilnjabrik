INSERT INTO users (name, email, password, phone, role, status, address) VALUES
('Admin Nyemil', 'admin@nyemilnjabrik.test', '$2b$10$V8F0wrIgdxKq3mKEdP77de0lR4F97RUIhlqPHyy3Qyie8DAFrf2p2', '081234567890', 'admin', 'active', 'Yogyakarta'),
('Sari Dewi', 'sari@example.com', '$2b$10$V8F0wrIgdxKq3mKEdP77de0lR4F97RUIhlqPHyy3Qyie8DAFrf2p2', '082211334455', 'customer', 'active', 'Jl. Kaliurang, Sleman'),
('Bima Pratama', 'bima@example.com', '$2b$10$V8F0wrIgdxKq3mKEdP77de0lR4F97RUIhlqPHyy3Qyie8DAFrf2p2', '081998887776', 'customer', 'active', 'Bantul');

INSERT INTO categories (name, slug, icon, description) VALUES
('Keripik', 'keripik', 'PiBowlFood', 'Cemilan renyah favorit keluarga'),
('Basreng', 'basreng', 'PiPepper', 'Pedas gurih dengan level pilihan'),
('Manis', 'manis', 'PiCookie', 'Snack manis untuk teman santai'),
('Paket Hampers', 'paket-hampers', 'PiGift', 'Paket premium untuk hadiah');

INSERT INTO products (category_id, name, slug, price, discount_percent, stock, min_stock, description, images, rating, sold_count, is_featured) VALUES
(1, 'Keripik Singkong Balado', 'keripik-singkong-balado', 18000, 10, 84, 20, 'Keripik singkong tipis dengan bumbu balado hangat dan gurih.', JSON_ARRAY('https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80'), 4.8, 942, TRUE),
(2, 'Basreng Njabrik Level 3', 'basreng-njabrik-level-3', 22000, 0, 36, 15, 'Basreng pedas gurih dengan tekstur renyah tahan lama.', JSON_ARRAY('https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=900&q=80'), 4.9, 1204, TRUE),
(3, 'Makaroni Keju Creamy', 'makaroni-keju-creamy', 16000, 5, 12, 15, 'Makaroni kriuk dengan taburan keju creamy premium.', JSON_ARRAY('https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80'), 4.7, 628, FALSE),
(4, 'Hampers Cemilan Premium', 'hampers-cemilan-premium', 89000, 12, 8, 10, 'Paket cantik berisi snack best seller untuk hadiah.', JSON_ARRAY('https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80'), 4.9, 226, TRUE);

INSERT INTO orders (order_code, user_id, subtotal, discount, shipping_cost, total, status, recipient_name, recipient_phone, shipping_address) VALUES
('NN-20260508-001', 2, 62000, 5000, 10000, 67000, 'dikirim', 'Sari Dewi', '082211334455', 'Jl. Kaliurang, Sleman'),
('NN-20260508-002', 3, 89000, 10000, 12000, 91000, 'diproses', 'Bima Pratama', '081998887776', 'Bantul');

INSERT INTO order_details (order_id, product_id, quantity, price, total) VALUES
(1, 1, 2, 18000, 36000),
(1, 2, 1, 22000, 22000),
(2, 4, 1, 89000, 89000);

INSERT INTO payments (order_id, method, amount, proof_image, status, paid_at) VALUES
(1, 'bank_transfer', 67000, '/uploads/payments/nn-001.jpg', 'verified', NOW()),
(2, 'ewallet', 91000, '/uploads/payments/nn-002.jpg', 'waiting', NULL);

INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES
(2, 1, 1, 5, 'Renyah, bumbunya pas, packing aman.'),
(2, 2, 1, 5, 'Pedasnya nagih dan tidak berminyak.');

INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'Pesanan baru', 'Order NN-20260508-002 menunggu diproses.', 'order'),
(1, 'Stok menipis', 'Hampers Cemilan Premium tersisa 8 pcs.', 'stock'),
(2, 'Pesanan dikirim', 'Order NN-20260508-001 sedang dalam pengiriman.', 'order');

INSERT INTO wishlist (user_id, product_id) VALUES
(2, 4),
(3, 2);

INSERT INTO stock_history (product_id, change_type, quantity, note, created_by) VALUES
(4, 'out', 1, 'Order NN-20260508-002', 1),
(3, 'adjustment', -4, 'Quality control batch', 1);
