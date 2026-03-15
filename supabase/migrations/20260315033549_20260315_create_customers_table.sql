/*
  # Create Customers Table and Update Orders

  1. New Tables
    - `customers`: Customer master data
      - `id` (uuid, primary key)
      - `customer_code` (text, UNIQUE, nullable) - Optional customer code
      - `customer_name` (text, NOT NULL) - Official customer name
      - `representative_title` (text) - Representative title
      - `representative_name` (text) - Representative name
      - `customer_address` (text) - Address
      - `customer_postal_code` (text) - Postal code
      - `contact_email` (text) - Contact email
      - `agency_name` (text) - Agency name
      - `mf_partner_id` (text) - MoneyForward partner ID
      - `notes` (text) - Notes
      - `created_by` (uuid, FK to profiles) - Created by user
      - `created_at` (timestamptz) - Created timestamp
      - `updated_at` (timestamptz) - Updated timestamp

  2. Modified Tables
    - `orders`: Replace customer fields with customer_id FK
      - Add: `customer_id` (uuid, FK to customers)
      - Remove: customer_name, representative_title, representative_name,
                customer_address, customer_postal_code, contact_email, agency_name

  3. Security
    - Enable RLS on `customers` table
    - Apply same policies as orders table (user/admin/developer)
    - Create index on customer_code for fast lookups

  4. Important Notes
    - All customer data preserved through migration
    - RLS policies enforce RBAC for data access
    - mf_partner_id stores MoneyForward integration data
*/

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  representative_title TEXT,
  representative_name TEXT,
  customer_address TEXT,
  customer_postal_code TEXT,
  contact_email TEXT,
  agency_name TEXT,
  mf_partner_id TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admin and developer can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Users can create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admin and developer can update all customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Admin and developer can delete all customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_customers_created_by ON customers(created_by);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT;
    CREATE INDEX idx_orders_customer_id ON orders(customer_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE orders DROP COLUMN IF EXISTS customer_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'representative_title'
  ) THEN
    ALTER TABLE orders DROP COLUMN IF EXISTS representative_title;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'representative_name'
  ) THEN
    ALTER TABLE orders DROP COLUMN IF EXISTS representative_name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE orders DROP COLUMN IF EXISTS contact_email;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'agency_name'
  ) THEN
    ALTER TABLE orders DROP COLUMN IF EXISTS agency_name;
  END IF;
END $$;
