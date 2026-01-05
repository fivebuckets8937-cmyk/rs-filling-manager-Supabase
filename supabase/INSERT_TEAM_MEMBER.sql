-- ============================================
-- 插入团队成员 - 修复语法错误版本
-- ============================================
-- 
-- 使用方法：
-- 1. 在 Supabase Dashboard > Authentication > Users 中创建用户
-- 2. 选择一个方式执行（推荐方式一）
-- ============================================

-- ============================================
-- 方式一：通过邮箱自动查找（最推荐）
-- ============================================
-- 优点：不需要手动复制UUID，自动从邮箱查找用户
-- 只需替换邮箱地址即可

INSERT INTO team_members (user_id, name, role, avatar)
SELECT 
  id, 
  'Yaohua', 
  'MANAGER',
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
FROM auth.users 
WHERE email = 'yaohua@example.com'  -- 替换为实际邮箱
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 方式二：手动指定UUID
-- ============================================
-- 如果方式一不工作，使用此方式
-- 1. 在 Authentication > Users 中找到用户
-- 2. 复制用户的 UUID
-- 3. 替换下面的 UUID 和名称

/*
INSERT INTO team_members (user_id, name, role, avatar)
VALUES (
  '96d07d8e-99ee-4b69-a46e-0ce68850cff0'::uuid,  -- 替换为实际UUID
  'Yaohua',
  'MANAGER',
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- ============================================
-- 验证插入结果
-- ============================================
-- 执行以下查询确认数据已正确插入

/*
SELECT 
  tm.id,
  tm.name,
  tm.role,
  au.email,
  tm.created_at
FROM team_members tm
LEFT JOIN auth.users au ON tm.user_id = au.id
ORDER BY tm.name;
*/

