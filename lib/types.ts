export type UserRole = 'developer' | 'admin' | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type OrderStatus = 'draft' | 'active' | 'void' | 'cancelled';
export type CloudSignStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled';
export type InvoiceStatus = 'pending' | 'invoiced' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  customer_code?: string;
  customer_name: string;
  representative_title?: string;
  representative_name?: string;
  customer_address?: string;
  customer_postal_code?: string;
  contact_email?: string;
  agency_name?: string;
  mf_partner_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  created_by: string;
  contract_date: string;
  start_date: string;
  end_date: string;
  service_description: string;
  special_notes?: string;
  amount: number;
  tax_rate: number;
  commission_rate?: number;
  payment_due_date?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  // Customer data (for display - joined from customers table)
  customer_name?: string;
  representative_title?: string;
  representative_name?: string;
  customer_address?: string;
  customer_postal_code?: string;
  contact_email?: string;
  agency_name?: string;
}

export interface Contract {
  id: string;
  order_id: string;
  user_id: string;
  cloudsign_document_id?: string;
  cloudsign_status?: CloudSignStatus;
  contract_start?: string;
  contract_end?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyRevenue {
  id: string;
  contract_id: string;
  target_month: string;
  revenue_amount: number;
  gross_profit: number;
  cloudsign_status?: CloudSignStatus;
  invoice_status: InvoiceStatus;
  mf_billing_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  encrypted: boolean;
  created_at: string;
  updated_at: string;
}
