/*
  # Create Functions for Monthly Revenues and Contract Management

  1. Functions Created
    - generate_monthly_revenues(): 契約から月次売上を自動生成
    - update_expired_contracts(): 期間終了契約を自動expired化
    - create_profile_trigger(): 新規ユーザー登録時プロフィール自動作成

  2. Triggers
    - on_auth_user_created: profiles自動作成

  3. Important Notes
    - generate_monthly_revenues: 契約開始～終了期間の全月を生成
    - 金額 = orders.amount_before_tax
    - 粗利 = 金額 * (1 - agency_commission_rate)
    - NULL commission_rateは0として扱う
*/

-- Function: generate_monthly_revenues
CREATE OR REPLACE FUNCTION generate_monthly_revenues(p_contract_id UUID)
RETURNS VOID AS $$
DECLARE
  v_contract_start DATE;
  v_contract_end DATE;
  v_order_id UUID;
  v_amount_before_tax DECIMAL;
  v_commission_rate DECIMAL;
  v_revenue_amount DECIMAL;
  v_gross_profit DECIMAL;
  v_current_date DATE;
BEGIN
  SELECT c.contract_start, c.contract_end, c.order_id
  INTO v_contract_start, v_contract_end, v_order_id
  FROM contracts c
  WHERE c.id = p_contract_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found: %', p_contract_id;
  END IF;

  SELECT o.amount_before_tax, COALESCE(o.agency_commission_rate, 0)
  INTO v_amount_before_tax, v_commission_rate
  FROM orders o
  WHERE o.id = v_order_id;

  v_revenue_amount := v_amount_before_tax;
  v_gross_profit := v_revenue_amount * (1 - (v_commission_rate / 100.0));

  v_current_date := DATE_TRUNC('month', v_contract_start)::DATE;

  WHILE v_current_date <= v_contract_end LOOP
    INSERT INTO monthly_revenues (
      contract_id,
      target_month,
      revenue_amount,
      gross_profit,
      invoice_status
    )
    VALUES (
      p_contract_id,
      v_current_date,
      v_revenue_amount,
      v_gross_profit,
      'pending'
    )
    ON CONFLICT (contract_id, target_month) DO NOTHING;

    v_current_date := v_current_date + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: update_expired_contracts
CREATE OR REPLACE FUNCTION update_expired_contracts()
RETURNS TABLE(updated_count INT) AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE contracts
  SET cloudsign_status = 'expired'
  WHERE cloudsign_status = 'signed'
    AND contract_end < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
