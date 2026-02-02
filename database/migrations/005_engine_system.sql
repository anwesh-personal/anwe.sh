-- =====================================================
-- ENGINE SYSTEM
-- AI engine deployment and assignment system
-- =====================================================

-- 1. AI ENGINES TABLE - Store deployed engines
CREATE TABLE IF NOT EXISTS ai_engines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  flow_config jsonb NOT NULL DEFAULT '{}',
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  models jsonb NOT NULL DEFAULT '[]',
  execution_mode text DEFAULT 'sequential' CHECK (execution_mode IN ('sequential', 'parallel')),
  tier text CHECK (tier IN ('free', 'basic', 'premium', 'enterprise')),
  active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used timestamptz
);

CREATE INDEX idx_ai_engines_tenant_id ON ai_engines(tenant_id);
CREATE INDEX idx_ai_engines_active ON ai_engines(active);
CREATE INDEX idx_ai_engines_tier ON ai_engines(tier);
CREATE INDEX idx_ai_engines_created_by ON ai_engines(created_by);

-- 2. ENGINE ASSIGNMENTS TABLE - Assign engines to users/tiers
CREATE TABLE IF NOT EXISTS engine_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  engine_id uuid REFERENCES ai_engines(id) ON DELETE CASCADE NOT NULL,
  assignment_type text CHECK (assignment_type IN ('tier', 'user', 'level')) NOT NULL,
  tier text CHECK (tier IN ('free', 'basic', 'premium', 'enterprise')),
  level_id uuid REFERENCES levels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_assignment CHECK (
    (assignment_type = 'tier' AND tier IS NOT NULL AND user_id IS NULL AND level_id IS NULL) OR
    (assignment_type = 'level' AND level_id IS NOT NULL AND user_id IS NULL AND tier IS NULL) OR
    (assignment_type = 'user' AND user_id IS NOT NULL AND tier IS NULL AND level_id IS NULL)
  )
);

CREATE INDEX idx_engine_assignments_tenant_id ON engine_assignments(tenant_id);
CREATE INDEX idx_engine_assignments_engine_id ON engine_assignments(engine_id);
CREATE INDEX idx_engine_assignments_user_id ON engine_assignments(user_id);
CREATE INDEX idx_engine_assignments_level_id ON engine_assignments(level_id);
CREATE INDEX idx_engine_assignments_tier ON engine_assignments(tier);
CREATE INDEX idx_engine_assignments_active ON engine_assignments(active);

-- 3. USER ENGINES TABLE - User-specific engine copies
CREATE TABLE IF NOT EXISTS user_engines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engine_id uuid NOT NULL REFERENCES ai_engines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  config jsonb DEFAULT '{}',
  nodes jsonb DEFAULT '[]',
  edges jsonb DEFAULT '[]',
  models jsonb DEFAULT '[]',
  api_key text UNIQUE,
  api_key_created_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id, engine_id)
);

CREATE INDEX idx_user_engines_tenant_id ON user_engines(tenant_id);
CREATE INDEX idx_user_engines_user_id ON user_engines(user_id);
CREATE INDEX idx_user_engines_engine_id ON user_engines(engine_id);
CREATE INDEX idx_user_engines_api_key ON user_engines(api_key);
CREATE INDEX idx_user_engines_status ON user_engines(status);

-- 4. LEVEL ENGINES TABLE - Level-based engine access
CREATE TABLE IF NOT EXISTS level_engines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  engine_id uuid NOT NULL REFERENCES ai_engines(id) ON DELETE CASCADE,
  access_type text DEFAULT 'execute' CHECK (access_type IN ('read', 'execute')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, level_id, engine_id)
);

CREATE INDEX idx_level_engines_tenant_id ON level_engines(tenant_id);
CREATE INDEX idx_level_engines_level_id ON level_engines(level_id);
CREATE INDEX idx_level_engines_engine_id ON level_engines(engine_id);
CREATE INDEX idx_level_engines_access_type ON level_engines(access_type);

-- 5. ENGINE EXECUTIONS TABLE - Track engine usage
CREATE TABLE IF NOT EXISTS engine_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  engine_id uuid REFERENCES ai_engines(id) ON DELETE SET NULL,
  user_engine_id uuid REFERENCES user_engines(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  execution_data jsonb DEFAULT '{}',
  input_data jsonb DEFAULT '{}',
  status text DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message text,
  execution_time_ms integer,
  tokens_used integer DEFAULT 0,
  cost_estimate numeric(10,4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_engine_executions_tenant_id ON engine_executions(tenant_id);
CREATE INDEX idx_engine_executions_engine_id ON engine_executions(engine_id);
CREATE INDEX idx_engine_executions_user_id ON engine_executions(user_id);
CREATE INDEX idx_engine_executions_status ON engine_executions(status);
CREATE INDEX idx_engine_executions_created_at ON engine_executions(created_at DESC);

-- Enable RLS
ALTER TABLE ai_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_executions ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_ai_engines_updated_at BEFORE UPDATE ON ai_engines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_engines_updated_at BEFORE UPDATE ON user_engines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
