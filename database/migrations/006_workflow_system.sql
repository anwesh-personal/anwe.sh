-- =====================================================
-- WORKFLOW SYSTEM
-- Custom workflow definitions and execution
-- =====================================================

-- 1. AI WORKFLOWS TABLE - Store custom workflow definitions
CREATE TABLE IF NOT EXISTS ai_workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  nodes jsonb NOT NULL DEFAULT '[]',
  connections jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_workflows_tenant_id ON ai_workflows(tenant_id);
CREATE INDEX idx_ai_workflows_created_by ON ai_workflows(created_by);
CREATE INDEX idx_ai_workflows_active ON ai_workflows(is_active);
CREATE INDEX idx_ai_workflows_public ON ai_workflows(is_public);
CREATE INDEX idx_ai_workflows_created_at ON ai_workflows(created_at DESC);

-- 2. WORKFLOW EXECUTIONS TABLE - Track workflow execution history
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES ai_workflows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'running' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step text,
  steps jsonb DEFAULT '[]',
  results jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  context jsonb DEFAULT '{}',
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_workflow_executions_tenant_id ON workflow_executions(tenant_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- 3. WORKFLOW TEMPLATES TABLE - Store reusable workflow templates
CREATE TABLE IF NOT EXISTS workflow_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  nodes jsonb NOT NULL DEFAULT '[]',
  connections jsonb NOT NULL DEFAULT '[]',
  is_public boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_workflow_templates_tenant_id ON workflow_templates(tenant_id);
CREATE INDEX idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_created_by ON workflow_templates(created_by);

-- 4. QUALITY GATE RESULTS TABLE - Store quality gate validation results
CREATE TABLE IF NOT EXISTS quality_gate_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  gate_name text NOT NULL,
  content_id text,
  execution_id uuid REFERENCES workflow_executions(id) ON DELETE CASCADE,
  passed boolean NOT NULL,
  score numeric(5,2) DEFAULT 0,
  feedback text,
  suggestions jsonb DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  context jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quality_gate_results_tenant_id ON quality_gate_results(tenant_id);
CREATE INDEX idx_quality_gate_results_execution_id ON quality_gate_results(execution_id);
CREATE INDEX idx_quality_gate_results_gate_name ON quality_gate_results(gate_name);
CREATE INDEX idx_quality_gate_results_created_at ON quality_gate_results(created_at DESC);

-- Enable RLS
ALTER TABLE ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_gate_results ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_ai_workflows_updated_at BEFORE UPDATE ON ai_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON workflow_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
