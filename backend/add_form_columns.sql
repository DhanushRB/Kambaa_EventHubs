-- Add missing branding columns to forms table
ALTER TABLE forms 
ADD COLUMN banner_image VARCHAR(500) NULL,
ADD COLUMN logo_image VARCHAR(500) NULL,
ADD COLUMN footer_text VARCHAR(1000) NULL,
ADD COLUMN brand_colors VARCHAR(500) NULL,
ADD COLUMN qr_code_image VARCHAR(500) NULL;