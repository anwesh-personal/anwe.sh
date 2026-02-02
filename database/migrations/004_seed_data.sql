-- =====================================================
-- SEED DATA
-- Initial data for development/testing
-- =====================================================

-- Insert default tenant
INSERT INTO tenants (id, name, slug, subscription_tier, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Default Tenant', 'default', 'enterprise', 'active')
ON CONFLICT DO NOTHING;

-- Insert default levels
INSERT INTO levels (id, tenant_id, name, slug, tier, priority, features)
VALUES 
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Free', 'free', 'free', 1, '["basic_ai"]'::jsonb),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Basic', 'basic', 'basic', 2, '["basic_ai", "advanced_ai"]'::jsonb),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Premium', 'premium', 'premium', 3, '["basic_ai", "advanced_ai", "custom_models"]'::jsonb),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Enterprise', 'enterprise', 'enterprise', 4, '["all_features"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default token policies
INSERT INTO level_token_policies (tenant_id, level_id, base_allocation, monthly_allocation, monthly_cap, allocation_mode, enforcement_mode)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 1000, NULL, 1000, 'lifetime', 'monitor'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 5000, 2000, 5000, 'monthly', 'warn'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 20000, 10000, 20000, 'monthly', 'hard'),
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 100000, 50000, NULL, 'monthly', 'hard')
ON CONFLICT DO NOTHING;

-- Insert super admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO superadmin_users (id, username, email, password_hash, full_name, role, is_active)
VALUES 
  ('20000000-0000-0000-0000-000000000001', 'admin', 'admin@example.com', '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'Super Admin', 'superadmin', true)
ON CONFLICT DO NOTHING;

-- Insert default AI providers (without API keys - add your own)
INSERT INTO ai_providers (id, tenant_id, name, provider_type, models, is_active, priority)
VALUES 
  ('30000000-0000-0000-0000-000000000001', NULL, 'OpenAI', 'openai', '["gpt-4", "gpt-3.5-turbo"]'::jsonb, true, 1),
  ('30000000-0000-0000-0000-000000000002', NULL, 'Anthropic', 'anthropic', '["claude-3-opus", "claude-3-sonnet"]'::jsonb, true, 2),
  ('30000000-0000-0000-0000-000000000003', NULL, 'Google AI', 'google', '["gemini-pro"]'::jsonb, true, 3)
ON CONFLICT DO NOTHING;

-- Insert default AI models metadata
INSERT INTO ai_models (id, provider_id, name, model_id, provider_type, context_window, max_tokens, input_cost_per_1k, output_cost_per_1k, capabilities)
VALUES 
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'GPT-4', 'gpt-4', 'openai', 8192, 4096, 0.03, 0.06, '["text", "code"]'::jsonb),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'GPT-3.5 Turbo', 'gpt-3.5-turbo', 'openai', 4096, 4096, 0.0015, 0.002, '["text", "code"]'::jsonb),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Claude 3 Opus', 'claude-3-opus-20240229', 'anthropic', 200000, 4096, 0.015, 0.075, '["text", "analysis"]'::jsonb),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'Claude 3 Sonnet', 'claude-3-sonnet-20240229', 'anthropic', 200000, 4096, 0.003, 0.015, '["text", "analysis"]'::jsonb),
  ('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Gemini Pro', 'gemini-pro', 'google', 32768, 8192, 0.0005, 0.0015, '["text", "multimodal"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert default system configurations
INSERT INTO system_configurations (tenant_id, key, value, description, is_public)
VALUES 
  (NULL, 'platform_name', '"Vanilla SaaS Platform"'::jsonb, 'Platform name', true),
  (NULL, 'max_file_size_mb', '10'::jsonb, 'Maximum file upload size in MB', true),
  (NULL, 'default_token_allocation', '1000'::jsonb, 'Default token allocation for new users', false),
  (NULL, 'ai_rate_limit_per_minute', '60'::jsonb, 'Default AI API rate limit per minute', false)
ON CONFLICT DO NOTHING;
