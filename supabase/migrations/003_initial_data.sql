-- Initial Team Members Data
-- 
-- IMPORTANT: Before running this script, you need to create users in Supabase Auth first.
-- 
-- Steps to initialize team members:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create users with the following emails (or use your own):
--    - yaohua@example.com (for Yaohua - MANAGER)
--    - flora@example.com (for Flora - MEMBER)
--    - shuman@example.com (for Shuman - MEMBER)
--    - yabin@example.com (for Yabin - MEMBER)
--    - wenlong@example.com (for Wenlong - MEMBER)
-- 3. Note down the user IDs from auth.users table
-- 4. Replace the user_id values in the INSERT statements below with actual user IDs
-- 5. Run this script in SQL Editor

-- Example: Get user IDs from auth.users
-- SELECT id, email FROM auth.users WHERE email IN (
--   'yaohua@example.com',
--   'flora@example.com',
--   'shuman@example.com',
--   'yabin@example.com',
--   'wenlong@example.com'
-- );

-- Insert team members
-- Replace 'USER_ID_HERE' with actual user IDs from auth.users

-- Yaohua (Manager)
-- INSERT INTO team_members (user_id, name, role, avatar)
-- SELECT id, 'Yaohua', 'MANAGER', 'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
-- FROM auth.users WHERE email = 'yaohua@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Flora (Member)
-- INSERT INTO team_members (user_id, name, role, avatar)
-- SELECT id, 'Flora', 'MEMBER', 'https://ui-avatars.com/api/?name=Flora&background=3b82f6&color=fff'
-- FROM auth.users WHERE email = 'flora@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Shuman (Member)
-- INSERT INTO team_members (user_id, name, role, avatar)
-- SELECT id, 'Shuman', 'MEMBER', 'https://ui-avatars.com/api/?name=Shuman&background=8b5cf6&color=fff'
-- FROM auth.users WHERE email = 'shuman@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Yabin (Member)
-- INSERT INTO team_members (user_id, name, role, avatar)
-- SELECT id, 'Yabin', 'MEMBER', 'https://ui-avatars.com/api/?name=Yabin&background=10b981&color=fff'
-- FROM auth.users WHERE email = 'yabin@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Wenlong (Member)
-- INSERT INTO team_members (user_id, name, role, avatar)
-- SELECT id, 'Wenlong', 'MEMBER', 'https://ui-avatars.com/api/?name=Wenlong&background=f59e0b&color=fff'
-- FROM auth.users WHERE email = 'wenlong@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Alternative: If you want to insert with explicit user IDs (after getting them from auth.users)
-- Uncomment and replace UUIDs with actual user IDs:

/*
INSERT INTO team_members (user_id, name, role, avatar) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Yaohua', 'MANAGER', 'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'),
  ('00000000-0000-0000-0000-000000000002', 'Flora', 'MEMBER', 'https://ui-avatars.com/api/?name=Flora&background=3b82f6&color=fff'),
  ('00000000-0000-0000-0000-000000000003', 'Shuman', 'MEMBER', 'https://ui-avatars.com/api/?name=Shuman&background=8b5cf6&color=fff'),
  ('00000000-0000-0000-0000-000000000004', 'Yabin', 'MEMBER', 'https://ui-avatars.com/api/?name=Yabin&background=10b981&color=fff'),
  ('00000000-0000-0000-0000-000000000005', 'Wenlong', 'MEMBER', 'https://ui-avatars.com/api/?name=Wenlong&background=f59e0b&color=fff')
ON CONFLICT (user_id) DO NOTHING;
*/

-- Verify the data was inserted correctly
-- SELECT tm.*, au.email 
-- FROM team_members tm
-- LEFT JOIN auth.users au ON tm.user_id = au.id
-- ORDER BY tm.name;

