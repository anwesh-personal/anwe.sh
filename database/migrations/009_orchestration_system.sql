-- =====================================================
-- ORCHESTRATION SYSTEM
-- Multi-agent orchestration and resource management
-- =====================================================

-- 1. COMMUNICATION CHANNELS TABLE
CREATE TABLE IF NOT EXISTS communication_channels (
  id text PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  participants text[] NOT NULL DEFAULT '{}',
  config jsonb DEFAULT '{}',
  message_count integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_communication_channels_tenant_id ON communication_channels(tenant_id);
CREATE INDEX idx_communication_channels_last_activity ON communication_channels(last_activity);

-- 2. PROTOCOL AGREEMENTS TABLE
CREATE TABLE IF NOT EXISTS protocol_agreements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  participants text[] NOT NULL DEFAULT '{}',
  protocol jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  established_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_protocol_agreements_tenant_id ON protocol_agreements(tenant_id);
CREATE INDEX idx_protocol_agreements_status ON protocol_agreements(status);
CREATE INDEX idx_protocol_agreements_expires_at ON protocol_agreements(expires_at);

-- 3. RESOURCE ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS resource_allocations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  task_id text NOT NULL,
  requirements jsonb NOT NULL DEFAULT '{}',
  strategy text NOT NULL DEFAULT 'adaptive',
  allocated_resources jsonb DEFAULT '{}',
  estimated_cost numeric(10,6) DEFAULT 0,
  actual_cost numeric(10,6),
  estimated_duration integer DEFAULT 0,
  actual_duration integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'released', 'failed')),
  created_at timestamptz DEFAULT now(),
  released_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_resource_allocations_tenant_id ON resource_allocations(tenant_id);
CREATE INDEX idx_resource_allocations_task_id ON resource_allocations(task_id);
CREATE INDEX idx_resource_allocations_status ON resource_allocations(status);

-- 4. RESOURCE PERFORMANCE METRICS TABLE
CREATE TABLE IF NOT EXISTS resource_performance_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  pool_id text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_resource_performance_metrics_tenant_id ON resource_performance_metrics(tenant_id);
CREATE INDEX idx_resource_performance_metrics_pool_id ON resource_performance_metrics(pool_id);
CREATE INDEX idx_resource_performance_metrics_recorded_at ON resource_performance_metrics(recorded_at);

-- 5. SYSTEM METRICS TABLE
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  metric_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_system_metrics_tenant_id ON system_metrics(tenant_id);
CREATE INDEX idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX idx_system_metrics_created_at ON system_metrics(created_at DESC);

-- Enable RLS
ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_communication_channels_updated_at BEFORE UPDATE ON communication_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protocol_agreements_updated_at BEFORE UPDATE ON protocol_agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON resource_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
