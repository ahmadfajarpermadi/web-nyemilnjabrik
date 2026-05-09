CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  avatar VARCHAR(255),
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  icon VARCHAR(80),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  price DECIMAL(12,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 10,
  description TEXT,
  images JSON,
  rating DECIMAL(3,2) DEFAULT 0,
  sold_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_code VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'pending',
  recipient_name VARCHAR(120) NOT NULL,
  recipient_phone VARCHAR(32) NOT NULL,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_details (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_details_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE payments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  method ENUM('bank_transfer', 'ewallet', 'cod') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  proof_image VARCHAR(255),
  status ENUM('waiting', 'verified', 'rejected') NOT NULL DEFAULT 'waiting',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('order', 'payment', 'stock', 'review', 'system') NOT NULL DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wishlist (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE stock_history (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  change_type ENUM('in', 'out', 'adjustment') NOT NULL,
  quantity INT NOT NULL,
  note VARCHAR(255),
  created_by BIGINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_stock_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
