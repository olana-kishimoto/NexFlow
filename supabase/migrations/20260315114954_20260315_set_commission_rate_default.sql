/*
  # Set commission_rate default value

  1. Modified Tables
    - `orders`
      - Set DEFAULT value for `commission_rate` column to 0
  
  2. Details
    - This prevents NOT NULL errors when commission_rate is not provided
    - Ensures consistency with frontend validation (parseFloat || 0)
    - Aligns with business logic where 0% commission is the default
*/

ALTER TABLE public.orders
  ALTER COLUMN commission_rate SET DEFAULT 0;