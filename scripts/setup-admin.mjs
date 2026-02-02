#!/usr/bin/env node

/**
 * ANWE.SH - Admin User Setup Script
 * Creates the initial admin user in Supabase
 * 
 * Usage: node scripts/setup-admin.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from project root
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const ADMIN_EMAIL = 'hello@mail.anwe.sh';
const ADMIN_PASSWORD = 'anweshrath';

async function createAdminUser() {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
        process.exit(1);
    }

    if (!serviceRoleKey) {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
        console.log('\nTo get your service role key:');
        console.log('1. Go to supabase.com → Your Project');
        console.log('2. Settings → API');
        console.log('3. Copy "service_role" key (secret)');
        console.log('4. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key');
        process.exit(1);
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log('\n🔐 ANWE.SH Admin Setup\n');
    console.log(`Creating admin user: ${ADMIN_EMAIL}`);

    try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const userExists = existingUsers?.users?.some(u => u.email === ADMIN_EMAIL);

        if (userExists) {
            console.log('⚠️  User already exists. Updating password...');

            // Find user and update password
            const existingUser = existingUsers.users.find(u => u.email === ADMIN_EMAIL);

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { password: ADMIN_PASSWORD }
            );

            if (updateError) {
                console.error('❌ Failed to update:', updateError.message);
                process.exit(1);
            }

            console.log('✅ Password updated successfully!\n');
        } else {
            // Create new user
            const { data, error } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                email_confirm: true, // Skip email confirmation
            });

            if (error) {
                console.error('❌ Failed to create user:', error.message);
                process.exit(1);
            }

            console.log('✅ Admin user created successfully!\n');
            console.log(`   User ID: ${data.user.id}`);
        }

        console.log('─────────────────────────────────────');
        console.log('   Email:    ' + ADMIN_EMAIL);
        console.log('   Password: ' + ADMIN_PASSWORD);
        console.log('─────────────────────────────────────');
        console.log('\n🚀 Login at: http://localhost:3000/login\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createAdminUser();
