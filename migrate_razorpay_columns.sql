-- ============================================================
-- Migration: Add Razorpay columns to gauswarn_payment table
-- Run this ONCE on your production MySQL database
-- ============================================================

-- Add paymentDetails column (stores full Razorpay payment object as JSON)
ALTER TABLE gauswarn_payment
  ADD COLUMN IF NOT EXISTS paymentDetails LONGTEXT DEFAULT NULL;

-- Add razorpay_payment_id column
ALTER TABLE gauswarn_payment
  ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100) DEFAULT NULL;

-- Add cart_data column (stores cart as JSON)
ALTER TABLE gauswarn_payment
  ADD COLUMN IF NOT EXISTS cart_data LONGTEXT DEFAULT NULL;

-- Add coupon and discount columns (if not already added)
ALTER TABLE gauswarn_payment
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS final_payable_amount DECIMAL(10,2) DEFAULT NULL;

-- Verify columns were added (run this to check)
-- DESCRIBE gauswarn_payment;
