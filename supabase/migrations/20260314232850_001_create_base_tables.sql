/*
  # NexFlow Hub - Create Base Tables

  1. New Tables
    - `profiles`: ユーザープロフィール（RBAC権限）
    - `system_settings`: システム設定（API キー保管）
    - `orders`: 受注管理
    - `contracts`: 契約管理（CloudSign連携）
    - `monthly_revenues`: 月次売上管理
    - `contract_history`: 契約変更履歴監査ログ

  2. Security
    - Enable RLS on all tables
    - Policies per role (developer/admin/user)

  3. Important Notes
    - All timestamps use DEFAULT now()
    - All UUIDs use DEFAULT gen_random_uuid()
    - RLS policies enforce RBAC
    - Sensitive columns (API keys) in system_settings
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('developer', 'admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin and developer can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Admin and developer can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- System settings table (developer only)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'developer'
  );

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  representative_title TEXT,
  representative_name TEXT,
  address TEXT,
  postal_code TEXT,
  contact_email TEXT NOT NULL,
  contract_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  service_description TEXT NOT NULL,
  special_terms TEXT,
  amount_before_tax DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(3, 1) NOT NULL DEFAULT 10.0,
  agency_commission_rate DECIMAL(4, 2) DEFAULT 0,
  agency_name TEXT,
  payment_due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin and developer can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Users can create and update own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin and developer can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- Contracts table (linked to orders)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cloudsign_document_id TEXT,
  cloudsign_status TEXT CHECK (cloudsign_status IN ('draft', 'sent', 'signed', 'expired', 'cancelled')),
  contract_start DATE,
  contract_end DATE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin and developer can view all contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Users can create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin and developer can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- Monthly revenues table
CREATE TABLE IF NOT EXISTS monthly_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  target_month DATE NOT NULL,
  revenue_amount DECIMAL(12, 2) NOT NULL,
  gross_profit DECIMAL(12, 2) NOT NULL,
  cloudsign_status TEXT,
  invoice_status TEXT NOT NULL DEFAULT 'pending' CHECK (invoice_status IN ('pending', 'invoiced', 'cancelled')),
  mf_billing_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(contract_id, target_month)
);

ALTER TABLE monthly_revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly revenues"
  ON monthly_revenues FOR SELECT
  TO authenticated
  USING (
    (SELECT user_id FROM contracts WHERE id = contract_id) = auth.uid()
  );

CREATE POLICY "Admin and developer can view all monthly revenues"
  ON monthly_revenues FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

CREATE POLICY "Admin and developer can update monthly revenues"
  ON monthly_revenues FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- Contract history (audit log)
CREATE TABLE IF NOT EXISTS contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and developers can view contract history"
  ON contract_history FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
  );

-- Create indexes for better query performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_contracts_order_id ON contracts(order_id);
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_cloudsign_status ON contracts(cloudsign_status);
CREATE INDEX idx_monthly_revenues_contract_id ON monthly_revenues(contract_id);
CREATE INDEX idx_monthly_revenues_target_month ON monthly_revenues(target_month);
CREATE INDEX idx_contract_history_contract_id ON contract_history(contract_id);
