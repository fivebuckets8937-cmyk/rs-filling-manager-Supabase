/**
 * Data Migration Tool: localStorage to Supabase
 * 
 * This script migrates existing data from localStorage to Supabase database.
 * 
 * Usage:
 * 1. Ensure you are logged in to the application (so localStorage has data)
 * 2. Set up environment variables in .env.local:
 *    VITE_SUPABASE_URL=your_supabase_url
 *    VITE_SUPABASE_ANON_KEY=your_anon_key
 * 
 * 3. Run with: npx tsx scripts/migrateFromLocalStorage.ts
 * 
 * Note: This script should be run from the browser console or as a one-time migration.
 * For browser console usage, copy the code and run it in the browser DevTools.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Browser version - Run this in browser console
 * 
 * Copy and paste this function into browser console after logging in
 */
export const migrateFromLocalStorageBrowser = async () => {
  console.log('Starting migration from localStorage to Supabase...\n');

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error: Not authenticated. Please login first.');
      return;
    }

    // Get team member ID
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teamMember) {
      console.error('Error: Team member not found. Please ensure your user has a team_member record.');
      return;
    }

    const teamMemberId = teamMember.id;

    // Read from localStorage
    const tasksPrefix = 'rs_tasks_';
    const tasksKey = Object.keys(localStorage).find(key => key.startsWith(tasksPrefix));
    
    if (!tasksKey) {
      console.log('No tasks found in localStorage.');
      return;
    }

    const tasksData = localStorage.getItem(tasksKey);
    if (!tasksData) {
      console.log('No tasks data found in localStorage.');
      return;
    }

    const tasks = JSON.parse(tasksData);
    console.log(`Found ${tasks.length} tasks in localStorage\n`);

    let successCount = 0;
    let errorCount = 0;

    // Migrate each task
    for (const task of tasks) {
      try {
        // Convert task to database format
        const dbTask = {
          id: task.id,
          project_number: task.projectNumber,
          project_owner: task.projectOwner || null,
          source: task.source || null,
          batch_info: task.batchInfo || null,
          received_date: task.receivedDate || null,
          start_date: task.startDate || null,
          completion_date: task.completionDate || null,
          deadline_date: task.deadlineDate || null,
          assignee_id: task.assigneeId || null,
          status: task.status,
          priority: task.priority,
          created_by: teamMemberId,
        };

        // Insert task
        const { data: savedTask, error: taskError } = await supabase
          .from('tasks')
          .upsert(dbTask, { onConflict: 'id' })
          .select()
          .single();

        if (taskError) {
          console.error(`Error saving task ${task.id}:`, taskError.message);
          errorCount++;
          continue;
        }

        // Migrate task progress
        if (task.progress && task.progress.length > 0) {
          // Delete existing progress
          await supabase
            .from('task_progress')
            .delete()
            .eq('task_id', savedTask.id);

          // Insert new progress
          const progressData = task.progress.map((p: any) => ({
            task_id: savedTask.id,
            day: p.day,
            label: p.label,
            is_completed: p.isCompleted || false,
            notes: p.notes || null,
          }));

          const { error: progressError } = await supabase
            .from('task_progress')
            .insert(progressData);

          if (progressError) {
            console.error(`Error saving progress for task ${task.id}:`, progressError.message);
          }
        }

        console.log(`✓ Migrated task: ${task.projectNumber}`);
        successCount++;
      } catch (error: any) {
        console.error(`Error migrating task ${task.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Successfully migrated: ${successCount} tasks`);
    console.log(`Errors: ${errorCount} tasks`);
    
    if (successCount > 0) {
      console.log('\nYou can now clear localStorage if desired.');
      console.log('Note: The old localStorage data will be automatically replaced by Supabase data.');
    }
  } catch (error: any) {
    console.error('Migration failed:', error.message);
  }
};

/**
 * Node.js version - For command line usage
 * Note: This requires localStorage simulation or reading from a file
 */
export const migrateFromLocalStorageNode = async (tasksData: any[], teamMemberId: string) => {
  console.log('Starting migration from provided data to Supabase...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const task of tasksData) {
    try {
      const dbTask = {
        id: task.id,
        project_number: task.projectNumber,
        project_owner: task.projectOwner || null,
        source: task.source || null,
        batch_info: task.batchInfo || null,
        received_date: task.receivedDate || null,
        start_date: task.startDate || null,
        completion_date: task.completionDate || null,
        deadline_date: task.deadlineDate || null,
        assignee_id: task.assigneeId || null,
        status: task.status,
        priority: task.priority,
        created_by: teamMemberId,
      };

      const { data: savedTask, error: taskError } = await supabase
        .from('tasks')
        .upsert(dbTask, { onConflict: 'id' })
        .select()
        .single();

      if (taskError) {
        console.error(`Error saving task ${task.id}:`, taskError.message);
        errorCount++;
        continue;
      }

      if (task.progress && task.progress.length > 0) {
        await supabase
          .from('task_progress')
          .delete()
          .eq('task_id', savedTask.id);

        const progressData = task.progress.map((p: any) => ({
          task_id: savedTask.id,
          day: p.day,
          label: p.label,
          is_completed: p.isCompleted || false,
          notes: p.notes || null,
        }));

        await supabase
          .from('task_progress')
          .insert(progressData);
      }

      successCount++;
    } catch (error: any) {
      console.error(`Error migrating task ${task.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`Successfully migrated: ${successCount} tasks`);
  console.log(`Errors: ${errorCount} tasks`);
};

// Browser console helper function
export const getMigrationCode = () => {
  return `
// Copy and paste this into browser console after logging in
(async () => {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  const supabase = createClient('${supabaseUrl}', '${supabaseAnonKey}');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Please login first');
    return;
  }
  
  // Get team member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (!teamMember) {
    console.error('Team member not found');
    return;
  }
  
  // Read localStorage
  const tasksKey = Object.keys(localStorage).find(k => k.startsWith('rs_tasks_'));
  if (!tasksKey) {
    console.log('No tasks in localStorage');
    return;
  }
  
  const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
  console.log(\`Found \${tasks.length} tasks\`);
  
  // Migrate tasks...
  // (rest of migration logic)
})();
  `.trim();
};

if (require.main === module) {
  console.log('This script is designed to run in the browser console.');
  console.log('For browser usage, use the migrateFromLocalStorageBrowser function.');
  console.log('\nTo get the browser code, run: getMigrationCode()');
}

