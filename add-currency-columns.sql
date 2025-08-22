-- Add currency columns to services table
-- Run this SQL to add support for dual currency pricing

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS "priceCurrency" VARCHAR(3) DEFAULT 'BGN',
ADD COLUMN IF NOT EXISTS "priceBgn" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "priceEur" DECIMAL(10,2);

-- Update existing services to have default values
UPDATE services 
SET 
  "priceCurrency" = 'BGN',
  "priceBgn" = price,
  "priceEur" = ROUND((price / 1.95583)::DECIMAL(10,2), 2)
WHERE "priceCurrency" IS NULL;

-- Make sure the columns are not null for new services
ALTER TABLE services 
ALTER COLUMN "priceCurrency" SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN services."priceCurrency" IS 'Currency of the price (BGN or EUR)';
COMMENT ON COLUMN services."priceBgn" IS 'Price in Bulgarian Lev';
COMMENT ON COLUMN services."priceEur" IS 'Price in Euro';
