# Database Migrations Guide

## Migration Order

**CRITICAL: Run migrations in this exact order!**

```bash
# 1. Core schema
psql -U postgres -d vanilla_saas -f 001_initial_schema.sql

# 2. Token functions
psql -U postgres -d vanilla_saas -f 002_token_management_functions.sql

# 3. RLS policies (basic)
psql -U postgres -d vanilla_saas -f 003_rls_policies.sql

# 4. Seed data
psql -U postgres -d vanilla_saas -f 004_seed_data.sql

# 5. Engine system
psql -U postgres -d vanilla_saas -f 005_engine_system.sql

# 6. Workflow system
psql -U postgres -d vanilla_saas -f 006_workflow_system.sql

# 7. Level enhancements
psql -U postgres -d vanilla_saas -f 007_level_system_enhancements.sql

# 8. Routing system
psql -U postgres -d vanilla_saas -f 008_routing_system.sql

# 9. Orchestration system
psql -U postgres -d vanilla_saas -f 009_orchestration_system.sql

# 10. Enhanced RLS policies
psql -U postgres -d vanilla_saas -f 010_rls_policies_enhanced.sql
```

## What Each Migration Does

### 001_initial_schema.sql
- Core tables: tenants, users, levels
- Token system: wallets, policies, ledger
- AI system: providers, models, executions
- Admin system: superadmin_users, admin_sessions
- System: configurations, audit_logs

### 002_token_management_functions.sql
- `adjust_user_tokens()` - Token operations
- `auto_allocate_tokens_for_level()` - Auto-allocation
- `reset_monthly_tokens()` - Monthly reset

### 003_rls_policies.sql
- Basic RLS policies for core tables
- Tenant isolation
- User access control

### 004_seed_data.sql
- Default tenant
- Default levels
- Token policies
- Super admin user
- AI providers and models

### 005_engine_system.sql
- AI engines table
- Engine assignments
- User engines
- Level engines
- Engine executions

### 006_workflow_system.sql
- AI workflows
- Workflow executions
- Workflow templates
- Quality gate results

### 007_level_system_enhancements.sql
- Level features
- Level pricing
- Level restrictions
- Level benefits
- Level upgrade paths
- Level feature usage
- Level analytics

### 008_routing_system.sql
- Routing strategies
- Routing metrics
- Worker registry
- Worker event logs

### 009_orchestration_system.sql
- Communication channels
- Protocol agreements
- Resource allocations
- Resource performance metrics
- System metrics

### 010_rls_policies_enhanced.sql
- RLS policies for all new tables
- Enhanced access control

## Verification

After running all migrations, verify:

```sql
-- Check table count (should be 43+)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

## Troubleshooting

**Error: relation already exists**
- Tables already created, safe to skip
- Or drop and recreate: `DROP TABLE IF EXISTS table_name CASCADE;`

**Error: function already exists**
- Functions already created, safe to skip
- Or replace: `CREATE OR REPLACE FUNCTION ...`

**Error: policy already exists**
- Policies already created, safe to skip
- Or drop first: `DROP POLICY IF EXISTS policy_name ON table_name;`

## Rollback

To rollback, run in reverse order (010 → 001) and drop tables/functions.

**Note**: Production rollbacks should be done carefully with backups!
