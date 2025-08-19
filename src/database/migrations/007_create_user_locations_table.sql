-- Create user_locations table for storing location search history
CREATE TABLE IF NOT EXISTS user_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  google_place_id VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  address VARCHAR(1000),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  types JSON,
  rating DECIMAL(3, 2),
  price_level INT,
  photos JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_place (user_id, google_place_id),
  INDEX idx_user_id (user_id),
  INDEX idx_place_id (google_place_id),
  INDEX idx_name (name),
  INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
