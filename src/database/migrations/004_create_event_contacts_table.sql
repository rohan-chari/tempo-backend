CREATE TABLE IF NOT EXISTS event_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  contact_id VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_emails JSON,
  contact_phone_numbers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_contact_id (contact_id),
  INDEX idx_contact_name (contact_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
