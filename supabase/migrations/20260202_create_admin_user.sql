-- =====================================================
-- ANWE.SH - Admin User Setup
-- Created: 2026-02-02
-- Creates the initial admin user for the platform
-- =====================================================

-- Create admin user using Supabase auth
-- Email: hello@mail.anwe.sh
-- Password: anweshrath (hashed with bcrypt)

-- First, check if user exists and delete if so (for clean setup)
DELETE FROM auth.users WHERE email = 'hello@mail.anwe.sh';

-- Insert the admin user
-- Password hash generated with: SELECT crypt('anweshrath', gen_salt('bf'));
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'hello@mail.anwe.sh',
    crypt('anweshrath', gen_salt('bf')),
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Anwesh Rath"}',
    FALSE,
    NOW(),
    NOW()
);

-- Also insert into auth.identities (required for Supabase Auth)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    id,
    jsonb_build_object('sub', id::text, 'email', email),
    'email',
    id::text,
    NOW(),
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'hello@mail.anwe.sh';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify the user was created:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'hello@mail.anwe.sh';
