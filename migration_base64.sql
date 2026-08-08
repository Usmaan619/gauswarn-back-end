-- Migration: Change image columns to LONGTEXT for base64 storage
-- Run this on your MySQL database before using base64 upload endpoints

-- =============================================
-- 1. Home Banners — banner1, banner2, banner3, banner4
-- =============================================
ALTER TABLE gauswarn_home_banners 
  MODIFY COLUMN banner1 LONGTEXT NULL,
  MODIFY COLUMN banner2 LONGTEXT NULL,
  MODIFY COLUMN banner3 LONGTEXT NULL,
  MODIFY COLUMN banner4 LONGTEXT NULL;

-- =============================================
-- 2. Gauswarn Products — product_images
-- =============================================
ALTER TABLE gauswarn_product 
  MODIFY COLUMN product_images LONGTEXT NULL;

-- =============================================
-- 3. Rajlaxmi Products — product_image
-- =============================================
ALTER TABLE rajlaxmi_product 
  MODIFY COLUMN product_image LONGTEXT NULL;
