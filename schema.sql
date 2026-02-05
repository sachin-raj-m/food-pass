-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RESET SCHEMA (WARNING: THIS DELETES ALL DATA)
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ENABLE EXTENSIONS
create extension if not exists "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'vendor', 'volunteer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT
);

-- EVENTS
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  coupon_expiry_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COUPONS
CREATE TABLE coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number TEXT,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unused', 'used', 'expired')) DEFAULT 'unused',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REDEMPTIONS
CREATE TABLE redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  redeemed_by UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'volunteer')),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Secure Role Check Helper
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$;

-- Profiles Policies
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated USING (
  get_my_role() = 'admin'
);

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (
  auth.uid() = id
);

-- Events Policies
CREATE POLICY "Admin full access on events" ON events FOR ALL TO authenticated 
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Vendor/Volunteer read events" ON events FOR SELECT TO authenticated USING (
  get_my_role() IN ('vendor', 'volunteer')
);

-- Coupons Policies
CREATE POLICY "Admin full access on coupons" ON coupons FOR ALL TO authenticated 
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Vendor/Volunteer read coupons" ON coupons FOR SELECT TO authenticated USING (
  get_my_role() IN ('vendor', 'volunteer')
);

-- Redemptions Policies
CREATE POLICY "Admin read all redemptions" ON redemptions FOR SELECT TO authenticated USING (
  get_my_role() = 'admin'
);

CREATE POLICY "Vendor/Volunteer insert redemptions" ON redemptions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = redeemed_by
  AND
  get_my_role() IN ('vendor', 'volunteer')
);

-- Redemption Function (Atomic)
CREATE OR REPLACE FUNCTION redeem_coupon(coupon_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_user_role TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;
  
  IF v_user_role NOT IN ('vendor', 'volunteer') THEN
    RAISE EXCEPTION 'Unauthorized: Only vendors or volunteers can redeem coupons.';
  END IF;

  SELECT * INTO v_coupon FROM coupons WHERE id = coupon_uuid FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon invalid.';
  END IF;

  IF v_coupon.status = 'used' THEN
    RAISE EXCEPTION 'Coupon already used.';
  END IF;

  IF v_coupon.status = 'expired' OR v_coupon.expires_at < NOW() THEN
    RAISE EXCEPTION 'Coupon expired.';
  END IF;

  UPDATE coupons SET status = 'used' WHERE id = coupon_uuid;

  INSERT INTO redemptions (coupon_id, redeemed_by, role)
  VALUES (coupon_uuid, v_user_id, v_user_role);

  RETURN jsonb_build_object('success', true, 'message', 'Coupon redeemed successfully.');
END;
$$;

-- Stats Helper Function
CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
RETURNS TABLE (
  meal_type TEXT,
  total_count BIGINT,
  used_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.meal_type,
    COUNT(*)::BIGINT as total_count,
    COUNT(CASE WHEN c.status = 'used' THEN 1 END)::BIGINT as used_count
  FROM coupons c
  WHERE c.event_id = event_uuid
  GROUP BY c.meal_type;
END;
$$;

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_coupons_event_meal ON coupons(event_id, meal_type);
CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_id ON redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_by ON redemptions(redeemed_by);
