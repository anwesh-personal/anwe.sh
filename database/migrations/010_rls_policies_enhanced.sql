-- =====================================================
-- ENHANCED RLS POLICIES
-- Additional RLS policies for new tables
-- =====================================================

-- AI ENGINES POLICIES
CREATE POLICY engines_tenant_isolation ON ai_engines
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() OR
    tenant_id IS NULL OR
    get_current_user_id() IN (SELECT id FROM users WHERE role = 'superadmin')
  );

-- ENGINE ASSIGNMENTS POLICIES
CREATE POLICY engine_assignments_tenant_isolation ON engine_assignments
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() OR
    get_current_user_id() IN (SELECT id FROM users WHERE role = 'superadmin')
  );

-- USER ENGINES POLICIES
CREATE POLICY user_engines_user_access ON user_engines
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY user_engines_user_manage ON user_engines
  FOR ALL
  USING (user_id = get_current_user_id());

-- LEVEL ENGINES POLICIES
CREATE POLICY level_engines_tenant_isolation ON level_engines
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- ENGINE EXECUTIONS POLICIES
CREATE POLICY engine_executions_user_access ON engine_executions
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY engine_executions_user_create ON engine_executions
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- AI WORKFLOWS POLICIES
CREATE POLICY workflows_user_access ON ai_workflows
  FOR SELECT
  USING (
    created_by = get_current_user_id() OR
    is_public = true OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY workflows_user_manage ON ai_workflows
  FOR ALL
  USING (created_by = get_current_user_id());

-- WORKFLOW EXECUTIONS POLICIES
CREATE POLICY workflow_executions_user_access ON workflow_executions
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY workflow_executions_user_create ON workflow_executions
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- WORKFLOW TEMPLATES POLICIES
CREATE POLICY workflow_templates_public_access ON workflow_templates
  FOR SELECT
  USING (
    is_public = true OR
    created_by = get_current_user_id() OR
    tenant_id = get_current_tenant_id()
  );

-- QUALITY GATE RESULTS POLICIES
CREATE POLICY quality_gate_results_user_access ON quality_gate_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE id = quality_gate_results.execution_id
      AND user_id = get_current_user_id()
    ) OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- LEVEL FEATURES POLICIES
CREATE POLICY level_features_tenant_isolation ON level_features
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- LEVEL PRICING POLICIES
CREATE POLICY level_pricing_tenant_isolation ON level_pricing
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- LEVEL RESTRICTIONS POLICIES
CREATE POLICY level_restrictions_tenant_isolation ON level_restrictions
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- LEVEL BENEFITS POLICIES
CREATE POLICY level_benefits_tenant_isolation ON level_benefits
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- LEVEL UPGRADE PATHS POLICIES
CREATE POLICY level_upgrade_paths_tenant_isolation ON level_upgrade_paths
  FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- LEVEL FEATURE USAGE POLICIES
CREATE POLICY level_feature_usage_user_access ON level_feature_usage
  FOR SELECT
  USING (
    user_id = get_current_user_id() OR
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- LEVEL ANALYTICS POLICIES
CREATE POLICY level_analytics_admin_access ON level_analytics
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- ROUTING STRATEGIES POLICIES
CREATE POLICY routing_strategies_read ON routing_strategies
  FOR SELECT
  USING (true);

CREATE POLICY routing_strategies_admin_manage ON routing_strategies
  FOR ALL
  USING (
    get_current_user_id() IN (SELECT id FROM users WHERE role IN ('admin', 'superadmin'))
  );

-- ROUTING METRICS POLICIES
CREATE POLICY routing_metrics_read ON routing_metrics
  FOR SELECT
  USING (true);

-- WORKER EVENT LOGS POLICIES
CREATE POLICY worker_event_logs_admin_access ON worker_event_logs
  FOR SELECT
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- WORKER REGISTRY POLICIES
CREATE POLICY worker_registry_admin_access ON worker_registry
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

-- ORCHESTRATION TABLES POLICIES
CREATE POLICY communication_channels_admin_access ON communication_channels
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY protocol_agreements_admin_access ON protocol_agreements
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY resource_allocations_admin_access ON resource_allocations
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY resource_performance_metrics_admin_access ON resource_performance_metrics
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY system_metrics_admin_access ON system_metrics
  FOR ALL
  USING (
    tenant_id = get_current_tenant_id() AND get_current_user_id() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') AND tenant_id = get_current_tenant_id()
    )
  );
