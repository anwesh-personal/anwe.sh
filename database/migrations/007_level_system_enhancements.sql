-- =====================================================
-- LEVEL SYSTEM ENHANCEMENTS
-- Granular feature control, pricing, restrictions
-- =====================================================

-- 1. LEVEL FEATURES TABLE - Granular feature control
CREATE TABLE IF NOT EXISTS level_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_category text NOT NULL,
  is_enabled boolean DEFAULT true,
  usage_limit integer,
  usage_period text CHECK (usage_period IN ('daily', 'weekly', 'monthly', 'yearly', 'lifetime')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, level_id, feature_name)
);

CREATE INDEX idx_level_features_tenant_id ON level_features(tenant_id);
CREATE INDEX idx_level_features_level_id ON level_features(level_id);
CREATE INDEX idx_level_features_category ON level_features(feature_category);

-- 2. LEVEL PRICING TABLE
CREATE TABLE IF NOT EXISTS level_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  pricing_type text NOT NULL CHECK (pricing_type IN ('one_time', 'monthly', 'yearly', 'lifetime')),
  price numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
  is_recurring boolean DEFAULT false,
  trial_days integer DEFAULT 0,
  trial_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_level_pricing_tenant_id ON level_pricing(tenant_id);
CREATE INDEX idx_level_pricing_level_id ON level_pricing(level_id);
CREATE INDEX idx_level_pricing_type ON level_pricing(pricing_type);

-- 3. LEVEL RESTRICTIONS TABLE
CREATE TABLE IF NOT EXISTS level_restrictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  restriction_type text NOT NULL,
  restriction_value text NOT NULL,
  restriction_description text,
  is_enforced boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_level_restrictions_tenant_id ON level_restrictions(tenant_id);
CREATE INDEX idx_level_restrictions_level_id ON level_restrictions(level_id);
CREATE INDEX idx_level_restrictions_type ON level_restrictions(restriction_type);

-- 4. LEVEL BENEFITS TABLE - Marketing features
CREATE TABLE IF NOT EXISTS level_benefits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  benefit_title text NOT NULL,
  benefit_description text,
  benefit_icon text,
  benefit_order integer DEFAULT 0,
  is_highlighted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_level_benefits_tenant_id ON level_benefits(tenant_id);
CREATE INDEX idx_level_benefits_level_id ON level_benefits(level_id);

-- 5. LEVEL UPGRADE PATHS TABLE
CREATE TABLE IF NOT EXISTS level_upgrade_paths (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  from_level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  to_level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  upgrade_type text DEFAULT 'standard' CHECK (upgrade_type IN ('standard', 'promotional', 'enterprise')),
  discount_percentage numeric(5,2) DEFAULT 0,
  upgrade_message text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, from_level_id, to_level_id)
);

CREATE INDEX idx_level_upgrade_paths_tenant_id ON level_upgrade_paths(tenant_id);
CREATE INDEX idx_level_upgrade_paths_from_level ON level_upgrade_paths(from_level_id);
CREATE INDEX idx_level_upgrade_paths_to_level ON level_upgrade_paths(to_level_id);

-- 6. LEVEL FEATURE USAGE TABLE - Track feature usage
CREATE TABLE IF NOT EXISTS level_feature_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 1,
  usage_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_level_feature_usage_tenant_id ON level_feature_usage(tenant_id);
CREATE INDEX idx_level_feature_usage_level_user ON level_feature_usage(level_id, user_id);
CREATE INDEX idx_level_feature_usage_date ON level_feature_usage(usage_date);

-- 7. LEVEL ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS level_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value numeric(15,4) NOT NULL,
  metric_unit text,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  user_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_level_analytics_tenant_id ON level_analytics(tenant_id);
CREATE INDEX idx_level_analytics_level_id ON level_analytics(level_id);
CREATE INDEX idx_level_analytics_period ON level_analytics(period_start, period_end);

-- Enable RLS
ALTER TABLE level_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_upgrade_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_analytics ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_level_features_updated_at BEFORE UPDATE ON level_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_pricing_updated_at BEFORE UPDATE ON level_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_restrictions_updated_at BEFORE UPDATE ON level_restrictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_benefits_updated_at BEFORE UPDATE ON level_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_upgrade_paths_updated_at BEFORE UPDATE ON level_upgrade_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
