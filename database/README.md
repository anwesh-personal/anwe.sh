# Database Documentation

## Migration Files

Run migrations in order:

1. `001_initial_schema.sql` - Core tables and structure
2. `002_token_management_functions.sql` - Token wallet functions
3. `003_rls_policies.sql` - Row Level Security policies
4. `004_seed_data.sql` - Initial seed data
5. `005_engine_system.sql` - AI engine system (engines, assignments, executions)
6. `006_workflow_system.sql` - Workflow system (workflows, executions, templates, quality gates)
7. `007_level_system_enhancements.sql` - Level system enhancements (features, pricing, restrictions, benefits)
8. `008_routing_system.sql` - Routing strategies and worker management
9. `009_orchestration_system.sql` - Multi-agent orchestration system
10. `010_rls_policies_enhanced.sql` - Enhanced RLS policies for new tables

## Running Migrations

### Local PostgreSQL

```bash
psql -U postgres -d vanilla_saas -f migrations/001_initial_schema.sql
psql -U postgres -d vanilla_saas -f migrations/002_token_management_functions.sql
psql -U postgres -d vanilla_saas -f migrations/003_rls_policies.sql
psql -U postgres -d vanilla_saas -f migrations/004_seed_data.sql
psql -U postgres -d vanilla_saas -f migrations/005_engine_system.sql
psql -U postgres -d vanilla_saas -f migrations/006_workflow_system.sql
psql -U postgres -d vanilla_saas -f migrations/007_level_system_enhancements.sql
psql -U postgres -d vanilla_saas -f migrations/008_routing_system.sql
psql -U postgres -d vanilla_saas -f migrations/009_orchestration_system.sql
psql -U postgres -d vanilla_saas -f migrations/010_rls_policies_enhanced.sql
```

### Supabase

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run each migration file in order

## Database Functions

### adjust_user_tokens()
Adjusts user token balance with ledger entry.

**Parameters:**
- `p_user_id` - User UUID
- `p_amount` - Amount (positive or negative)
- `p_direction` - credit, debit, reserve, release, adjustment
- `p_reason` - Reason for adjustment
- `p_source` - Source of adjustment
- `p_reference_type` - Reference type
- `p_reference_id` - Reference UUID
- `p_execution_id` - Execution UUID
- `p_metadata` - Additional metadata

**Returns:** Ledger entry JSON

### auto_allocate_tokens_for_level()
Automatically allocates tokens based on level policy.

**Parameters:**
- `p_user_id` - User UUID
- `p_level_id` - Level UUID

**Returns:** Allocation result JSON

### reset_monthly_tokens()
Resets monthly token allocations. Run via cron job.

**Returns:** Number of wallets reset

## RLS Policies

Row Level Security ensures:
- Users can only access their own data
- Admins can access tenant data
- Super admins can access all data
- Tenant isolation enforced at database level

## Seed Data

Default seed data includes:
- Default tenant
- Free, Basic, Premium, Enterprise levels
- Token policies for each level
- Super admin user (CHANGE PASSWORD!)
- Default AI providers (add your API keys)
- AI model metadata

## Backup & Restore

### Backup

```bash
pg_dump -U postgres vanilla_saas > backup.sql
```

### Restore

```bash
psql -U postgres vanilla_saas < backup.sql
```

## Indexes

All foreign keys and commonly queried columns are indexed for performance.

## Maintenance

### Monthly Token Reset

Set up cron job to run:
```sql
SELECT reset_monthly_tokens();
```

Recommended: Run on 1st of each month at midnight.

### Cleanup Old Data

```sql
-- Clean old execution records (older than 90 days)
DELETE FROM ai_executions 
WHERE created_at < now() - interval '90 days';

-- Clean old audit logs (older than 1 year)
DELETE FROM audit_logs 
WHERE created_at < now() - interval '1 year';
```
