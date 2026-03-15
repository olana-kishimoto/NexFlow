/*
  # Update Orders Table Column Names

  1. Column Renames
    - Rename `user_id` to `created_by`
    - Rename `amount_before_tax` to `amount`
    - Rename `agency_commission_rate` to `commission_rate`
    - Rename `address` to `customer_address`
    - Rename `postal_code` to `customer_postal_code`
    - Rename `special_terms` to `special_notes`

  2. Security
    - Update RLS policies to reference new column names
    - Update indexes to use new column names

  3. Important Notes
    - All data preserved during column rename
    - Foreign key constraints maintained
    - RLS policies automatically reference new names
*/

-- Rename columns in orders table
ALTER TABLE orders RENAME COLUMN user_id TO created_by;
ALTER TABLE orders RENAME COLUMN amount_before_tax TO amount;
ALTER TABLE orders RENAME COLUMN agency_commission_rate TO commission_rate;
ALTER TABLE orders RENAME COLUMN address TO customer_address;
ALTER TABLE orders RENAME COLUMN postal_code TO customer_postal_code;
ALTER TABLE orders RENAME COLUMN special_terms TO special_notes;

-- Drop and recreate indexes with new column names
DROP INDEX IF EXISTS idx_orders_user_id;
CREATE INDEX idx_orders_created_by ON orders(created_by);

-- Update RLS policies for orders table
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create and update own orders" ON orders;
CREATE POLICY "Users can create and update own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
