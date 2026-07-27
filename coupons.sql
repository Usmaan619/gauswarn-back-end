CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percent', 'flat') NOT NULL,
    discount_value INT NOT NULL,
    min_order_value INT DEFAULT 0,
    max_discount INT DEFAULT NULL,
    usage_limit INT NOT NULL,
    used_count INT DEFAULT 0,
    expiry_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_expiry (expiry_date)
);


-- ALTER TABLE gauswarn_payment 
-- ADD COLUMN coupon_code VARCHAR(100) DEFAULT NULL,
-- ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00,
-- ADD COLUMN final_payable_amount DECIMAL(10,2) DEFAULT NULL,

