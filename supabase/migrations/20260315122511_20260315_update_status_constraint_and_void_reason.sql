/*
  # Update orders table status constraint and add void_reason column

  1. Modified Tables
    - `orders`
      - Replace status CHECK constraint with new values
      - Add void_reason column for storing void reasons

  2. New Status Values
    - 'draft': 下書き（編集可能）
    - 'active': 契約締結済み（CloudSign signed後に自動移行）
    - 'void': 無効（手動で無効フラグ）
    - 'cancelled': 解約済み

  3. Status Transition Rules
    - draft → active (CloudSign signed)
    - draft → void (manual cancel before signing)
    - active → void (manual invalidate after signing)
    - active → cancelled (cancellation)

  4. New Columns
    - void_reason: reason text when order is voided
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_status_check'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('draft', 'active', 'void', 'cancelled'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS void_reason text;