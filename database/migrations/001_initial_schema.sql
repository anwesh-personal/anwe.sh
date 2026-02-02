-- =====================================================
-- VANILLA SAAS TEMPLATE - INITIAL DATABASE SCHEMA
-- Multi-tenant, AI-centric SaaS platform
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  domain text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  settings jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- =====================================================
-- 2. USERS TABLE (Multi-tenant aware)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  username text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium', 'enterprise')),
  access_level integer DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 10),
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  last_login timestamptz,
  preferences jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_tier ON users(tier);

-- =====================================================
-- 3. LEVELS TABLE (Subscription/Feature Levels)
-- =====================================================
CREATE TABLE IF NOT EXISTS levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'premium', 'enterprise')),
  priority integer DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_levels_tenant_id ON levels(tenant_id);
CREATE INDEX idx_levels_tier ON levels(tier);

-- =====================================================
-- 4. USER TOKEN WALLETS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_token_wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid REFERENCES levels(id) ON DELETE SET NULL,
  current_tokens bigint NOT NULL DEFAULT 0,
  reserved_tokens bigint NOT NULL DEFAULT 0,
  lifetime_tokens bigint NOT NULL DEFAULT 0,
  monthly_allocation_tokens bigint NOT NULL DEFAULT 0,
  borrowed_tokens bigint NOT NULL DEFAULT 0,
  last_reset_at timestamptz,
  next_reset_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'suspended')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_token_wallets_non_negative CHECK (
    current_tokens >= 0 AND
    reserved_tokens >= 0 AND
    lifetime_tokens >= 0 AND
    monthly_allocation_tokens >= 0 AND
    borrowed_tokens >= 0
  )
);

CREATE UNIQUE INDEX idx_user_token_wallets_user_id ON user_token_wallets(user_id);
CREATE INDEX idx_user_token_wallets_tenant_id ON user_token_wallets(tenant_id);
CREATE INDEX idx_user_token_wallets_level_id ON user_token_wallets(level_id);

-- =====================================================
-- 5. TOKEN POLICIES
-- =====================================================
CREATE TABLE IF NOT EXISTS level_token_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  base_allocation integer NOT NULL DEFAULT 0,
  monthly_allocation integer,
  monthly_cap integer,
  rollover_percent numeric(5,2) NOT NULL DEFAULT 0,
  allocation_mode text NOT NULL DEFAULT 'lifetime' CHECK (allocation_mode IN ('lifetime', 'monthly')),
  enforcement_mode text NOT NULL DEFAULT 'monitor' CHECK (enforcement_mode IN ('monitor', 'warn', 'hard')),
  priority_weight integer NOT NULL DEFAULT 1,
  allow_manual_override boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT level_token_policies_rollover_check CHECK (rollover_percent >= 0 AND rollover_percent <= 100),
  UNIQUE(tenant_id, level_id)
);

CREATE INDEX idx_level_token_policies_tenant_id ON level_token_policies(tenant_id);
CREATE INDEX idx_level_token_policies_level_id ON level_token_policies(level_id);

-- User-specific token policies (override level policies)
CREATE TABLE IF NOT EXISTS user_token_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id uuid REFERENCES levels(id) ON DELETE SET NULL,
  base_allocation integer,
  monthly_allocation integer,
  monthly_cap integer,
  rollover_percent numeric(5,2),
  allocation_mode text CHECK (allocation_mode IN ('lifetime', 'monthly')),
  enforcement_mode text CHECK (enforcement_mode IN ('monitor', 'warn', 'hard')),
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_user_token_policies_tenant_id ON user_token_policies(tenant_id);
CREATE INDEX idx_user_token_policies_user_id ON user_token_policies(user_id);

-- =====================================================
-- 6. TOKEN LEDGER (Immutable transaction log)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_token_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid NOT NULL REFERENCES user_token_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid REFERENCES levels(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('credit', 'debit', 'reserve', 'release', 'adjustment')),
  amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  reserved_after bigint NOT NULL,
  lifetime_after bigint NOT NULL,
  reason text NOT NULL,
  source text NOT NULL DEFAULT 'system',
  reference_type text,
  reference_id uuid,
  execution_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_user_token_ledger_wallet_id ON user_token_ledger(wallet_id);
CREATE INDEX idx_user_token_ledger_user_id ON user_token_ledger(user_id);
CREATE INDEX idx_user_token_ledger_tenant_id ON user_token_ledger(tenant_id);
CREATE INDEX idx_user_token_ledger_created_at ON user_token_ledger(created_at);
CREATE INDEX idx_user_token_ledger_reference ON user_token_ledger(reference_type, reference_id);

-- =====================================================
-- 7. AI PROVIDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_providers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'google', 'custom')),
  api_key_encrypted text,
  base_url text,
  models jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  rate_limit_per_minute integer,
  rate_limit_per_day integer,
  settings jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_providers_tenant_id ON ai_providers(tenant_id);
CREATE INDEX idx_ai_providers_type ON ai_providers(provider_type);
CREATE INDEX idx_ai_providers_active ON ai_providers(is_active);

-- =====================================================
-- 8. AI MODELS METADATA
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id uuid REFERENCES ai_providers(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  model_id text NOT NULL,
  provider_type text NOT NULL,
  context_window integer,
  max_tokens integer,
  input_cost_per_1k numeric(10,6),
  output_cost_per_1k numeric(10,6),
  capabilities jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_models_tenant_id ON ai_models(tenant_id);

-- =====================================================
-- 9. AI EXECUTIONS (Usage tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES ai_providers(id) ON DELETE SET NULL,
  model_id uuid REFERENCES ai_models(id) ON DELETE SET NULL,
  model_name text,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  tokens_debited bigint DEFAULT 0,
  cost_usd numeric(10,6) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  execution_time_ms integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_ai_executions_tenant_id ON ai_executions(tenant_id);
CREATE INDEX idx_ai_executions_user_id ON ai_executions(user_id);
CREATE INDEX idx_ai_executions_provider_id ON ai_executions(provider_id);
CREATE INDEX idx_ai_executions_status ON ai_executions(status);
CREATE INDEX idx_ai_executions_created_at ON ai_executions(created_at);

-- =====================================================
-- 10. API KEYS
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  name text,
  permissions jsonb DEFAULT '[]',
  rate_limit_per_minute integer,
  rate_limit_per_day integer,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- =====================================================
-- 11. SUPER ADMIN USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS superadmin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  role text DEFAULT 'superadmin' CHECK (role IN ('superadmin', 'admin')),
  permissions jsonb DEFAULT '["all"]',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_superadmin_users_username ON superadmin_users(username);
CREATE INDEX idx_superadmin_users_email ON superadmin_users(email);

-- =====================================================
-- 12. ADMIN SESSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES superadmin_users(id) ON DELETE CASCADE,
  session_data jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_active ON admin_sessions(is_active);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- =====================================================
-- 13. SYSTEM CONFIGURATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS system_configurations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_system_configurations_tenant_id ON system_configurations(tenant_id);
CREATE INDEX idx_system_configurations_key ON system_configurations(key);

-- =====================================================
-- 14. AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- 15. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_token_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your authentication system
-- Example policies are provided in separate migration files

-- =====================================================
-- 16. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_levels_updated_at BEFORE UPDATE ON levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_token_wallets_updated_at BEFORE UPDATE ON user_token_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_level_token_policies_updated_at BEFORE UPDATE ON level_token_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_token_policies_updated_at BEFORE UPDATE ON user_token_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_superadmin_users_updated_at BEFORE UPDATE ON superadmin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at BEFORE UPDATE ON system_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF INITIAL SCHEMA
-- =====================================================
