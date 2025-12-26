/**
 * Team Members Initialization Script
 * 
 * This script helps initialize team members in Supabase.
 * 
 * Usage:
 * 1. Set up environment variables in .env.local:
 *    VITE_SUPABASE_URL=your_supabase_url
 *    VITE_SUPABASE_ANON_KEY=your_anon_key
 * 
 * 2. Run with: npx tsx scripts/initTeamMembers.ts
 * 
 * Or use in Supabase Dashboard SQL Editor with modifications
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Team members data (from constants.ts)
const TEAM_MEMBERS = [
  { name: 'Yaohua', role: 'MANAGER' as const, email: 'yaohua@example.com', avatar: 'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff' },
  { name: 'Flora', role: 'MEMBER' as const, email: 'flora@example.com', avatar: 'https://ui-avatars.com/api/?name=Flora&background=3b82f6&color=fff' },
  { name: 'Shuman', role: 'MEMBER' as const, email: 'shuman@example.com', avatar: 'https://ui-avatars.com/api/?name=Shuman&background=8b5cf6&color=fff' },
  { name: 'Yabin', role: 'MEMBER' as const, email: 'yabin@example.com', avatar: 'https://ui-avatars.com/api/?name=Yabin&background=10b981&color=fff' },
  { name: 'Wenlong', role: 'MEMBER' as const, email: 'wenlong@example.com', avatar: 'https://ui-avatars.com/api/?name=Wenlong&background=f59e0b&color=fff' },
];

/**
 * Initialize team members
 * This function:
 * 1. Creates auth users (if they don't exist)
 * 2. Creates team_member records linked to auth users
 */
async function initTeamMembers() {
  console.log('Starting team members initialization...\n');

  for (const member of TEAM_MEMBERS) {
    try {
      console.log(`Processing ${member.name} (${member.role})...`);

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let userId = existingUsers?.users.find(u => u.email === member.email)?.id;

      // Create auth user if doesn't exist
      if (!userId) {
        console.log(`  Creating auth user for ${member.email}...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: member.email,
          password: 'TempPassword123!', // User should change this on first login
          email_confirm: true,
        });

        if (createError) {
          console.error(`  Error creating user: ${createError.message}`);
          continue;
        }

        userId = newUser.user.id;
        console.log(`  ✓ Auth user created with ID: ${userId}`);
      } else {
        console.log(`  ✓ Auth user already exists: ${userId}`);
      }

      // Check if team_member record exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        console.log(`  ✓ Team member record already exists\n`);
        continue;
      }

      // Create team_member record
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          user_id: userId,
          name: member.name,
          role: member.role,
          avatar: member.avatar,
        })
        .select()
        .single();

      if (memberError) {
        console.error(`  ✗ Error creating team member: ${memberError.message}\n`);
      } else {
        console.log(`  ✓ Team member record created: ${teamMember.id}\n`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error processing ${member.name}: ${error.message}\n`);
    }
  }

  console.log('Initialization complete!');
  console.log('\nNote: Users should change their passwords on first login.');
  console.log('Default password: TempPassword123!');
}

// Run the initialization
initTeamMembers().catch(console.error);

