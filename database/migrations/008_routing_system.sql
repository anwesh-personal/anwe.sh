-- =====================================================
-- ROUTING SYSTEM
-- Worker routing strategies and metrics
-- =====================================================

-- 1. ROUTING STRATEGIES TABLE
CREATE TABLE IF NOT EXISTS routing_strategies (
  id text PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  use_case text,
  pros jsonb DEFAULT '[]',
  cons jsonb DEFAULT '[]',
  recommended boolean DEFAULT false,
  enabled boolean DEFAULT true,
  custom_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_routing_strategies_tenant_id ON routing_strategies(tenant_id);
CREATE INDEX idx_routing_strategies_enabled ON routing_strategies(enabled);
CREATE INDEX idx_routing_strategies_recommended ON routing_strategies(recommended);

-- 2. ROUTING METRICS TABLE
CREATE TABLE IF NOT EXISTS routing_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  total_routed integer DEFAULT 0,
  by_worker jsonb DEFAULT '{}',
  by_strategy jsonb DEFAULT '{}',
  by_region jsonb DEFAULT '{}',
  last_reset timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_routing_metrics_tenant_id ON routing_metrics(tenant_id);
CREATE INDEX idx_routing_metrics_worker_id ON routing_metrics(worker_id);
CREATE INDEX idx_routing_metrics_last_reset ON routing_metrics(last_reset DESC);

-- 3. WORKER EVENT LOGS TABLE
CREATE TABLE IF NOT EXISTS worker_event_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_worker_event_logs_tenant_id ON worker_event_logs(tenant_id);
CREATE INDEX idx_worker_event_logs_worker_id ON worker_event_logs(worker_id);
CREATE INDEX idx_worker_event_logs_event_type ON worker_event_logs(event_type);
CREATE INDEX idx_worker_event_logs_severity ON worker_event_logs(severity);
CREATE INDEX idx_worker_event_logs_created_at ON worker_event_logs(created_at DESC);

-- 4. WORKER REGISTRY TABLE
CREATE TABLE IF NOT EXISTS worker_registry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  worker_id text NOT NULL UNIQUE,
  worker_type text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  health_score integer DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  capacity integer DEFAULT 1,
  current_load integer DEFAULT 0,
  region text,
  tags jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  last_heartbeat timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_worker_registry_tenant_id ON worker_registry(tenant_id);
CREATE INDEX idx_worker_registry_worker_id ON worker_registry(worker_id);
CREATE INDEX idx_worker_registry_status ON worker_registry(status);
CREATE INDEX idx_worker_registry_health_score ON worker_registry(health_score);
CREATE INDEX idx_worker_registry_last_heartbeat ON worker_registry(last_heartbeat);

-- Insert default routing strategies
INSERT INTO routing_strategies (id, name, description, use_case, pros, cons, recommended) VALUES
('round_robin', 'Round Robin', 'Distribute jobs evenly across all workers in rotation', 'Simple load distribution',
 '["Simple and predictable", "Even distribution", "No complex calculations"]'::jsonb,
 '["Ignores worker capacity", "May overload slow workers", "No health awareness"]'::jsonb,
 false),
('least_loaded', 'Least Loaded', 'Assign jobs to worker with fewest active jobs', 'Best for balanced load',
 '["Balances load effectively", "Responds to current state", "Prevents overload"]'::jsonb,
 '["Requires real-time metrics", "May cause thrashing", "Ignores worker capacity"]'::jsonb,
 true),
('health_based', 'Health-Based', 'Only route to healthy workers (health score > 60)', 'High availability',
 '["Avoids unhealthy workers", "High reliability", "Self-healing"]'::jsonb,
 '["Requires health monitoring", "May exclude workers unnecessarily"]'::jsonb,
 true),
('capacity_aware', 'Capacity-Aware', 'Consider worker capacity and current load', 'Prevent overload',
 '["Prevents overload", "Maximizes utilization", "Balanced approach"]'::jsonb,
 '["Complex calculations", "Requires accurate metrics"]'::jsonb,
 true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE routing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_registry ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_routing_strategies_updated_at BEFORE UPDATE ON routing_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_metrics_updated_at BEFORE UPDATE ON routing_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_registry_updated_at BEFORE UPDATE ON worker_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
