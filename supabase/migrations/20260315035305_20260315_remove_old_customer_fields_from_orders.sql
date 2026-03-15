/*
  # Remove old customer fields from orders table

  This migration removes the customer-related columns that were moved to the customers table.
  These columns are no longer needed since customer_id now references the customers table.

  1. Removed Columns
    - customer_address
    - customer_postal_code

  2. Important Notes
    - customer_id and customer data are now in the customers table
    - Data must be fetched via JOIN with customers table
    - No data loss as customers table has been populated
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE orders DROP COLUMN customer_address;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_postal_code'
  ) THEN
    ALTER TABLE orders DROP COLUMN customer_postal_code;
  END IF;
END $$;
