# 修复 INSERT INTO team_members 语法错误

## 错误信息
```
ERROR: 42601: syntax error at or near "'96d07d8e-99ee-4b69-a46e-0ce68850cff0'"
LINE 7: ('96d07d8e-99ee-4b69-a46e-0ce68850cff0', 'Yaohua', 'MANAGER', null);
```

## 问题原因

这个错误通常由以下原因引起：
1. **缺少 VALUES 关键字**：INSERT 语句中遗漏了 `VALUES`
2. **多行 INSERT 格式错误**：多个值之间缺少逗号
3. **前面的语句未正确结束**：可能有未完成的SQL语句
4. **UUID 格式问题**：某些情况下需要显式类型转换

## ✅ 正确的 INSERT 语句格式

### 方法一：单行插入（推荐）

```sql
INSERT INTO team_members (user_id, name, role, avatar)
VALUES (
  '96d07d8e-99ee-4b69-a46e-0ce68850cff0'::uuid, 
  'Yaohua', 
  'MANAGER', 
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
);
```

**注意：** 添加了 `::uuid` 类型转换，确保UUID格式正确。

### 方法二：多行插入

如果一次插入多个用户，使用以下格式：

```sql
INSERT INTO team_members (user_id, name, role, avatar) VALUES
  ('96d07d8e-99ee-4b69-a46e-0ce68850cff0'::uuid, 'Yaohua', 'MANAGER', 'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'),
  ('另一个-uuid-这里'::uuid, 'Flora', 'MEMBER', 'https://ui-avatars.com/api/?name=Flora&background=3b82f6&color=fff')
ON CONFLICT (user_id) DO NOTHING;
```

### 方法三：从 auth.users 查询（最安全）

这是最推荐的方式，避免手动输入UUID：

```sql
INSERT INTO team_members (user_id, name, role, avatar)
SELECT 
  id::uuid, 
  'Yaohua', 
  'MANAGER', 
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
FROM auth.users 
WHERE email = 'yaohua@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

**优点：**
- 不需要手动复制UUID
- 自动从邮箱查找用户
- 如果用户不存在会安全失败（不会报错）

## 🔧 完整操作步骤

### 步骤 1: 创建认证用户

1. 进入 Supabase Dashboard > **Authentication > Users**
2. 点击 **Add user** > **Create new user**
3. 填写信息：
   - Email: `yaohua@example.com`（或你的邮箱）
   - Password: 设置密码
   - ✅ 勾选 **Auto Confirm User**
4. 点击 **Create user**

### 步骤 2: 创建团队成员记录

**方式A：通过邮箱自动查找（推荐）**

```sql
INSERT INTO team_members (user_id, name, role, avatar)
SELECT 
  id, 
  'Yaohua', 
  'MANAGER', 
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
FROM auth.users 
WHERE email = 'yaohua@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

**方式B：手动指定UUID**

1. 在 **Authentication > Users** 中找到用户
2. 复制用户的 **UUID**（ID列）
3. 执行以下SQL（替换UUID）：

```sql
INSERT INTO team_members (user_id, name, role, avatar)
VALUES (
  '粘贴你的UUID到这里'::uuid,
  'Yaohua',
  'MANAGER',
  'https://ui-avatars.com/api/?name=Yaohua&background=0f172a&color=fff'
)
ON CONFLICT (user_id) DO NOTHING;
```

### 步骤 3: 验证插入结果

```sql
SELECT 
  tm.id,
  tm.name,
  tm.role,
  au.email,
  tm.created_at
FROM team_members tm
LEFT JOIN auth.users au ON tm.user_id = au.id
WHERE tm.name = 'Yaohua';
```

## ⚠️ 常见错误示例

### ❌ 错误示例 1: 缺少 VALUES

```sql
-- 错误！
INSERT INTO team_members (user_id, name, role, avatar)
('96d07d8e-99ee-4b69-a46e-0ce68850cff0', 'Yaohua', 'MANAGER', null);
```

**修复：** 添加 `VALUES` 关键字

### ❌ 错误示例 2: 多行格式错误

```sql
-- 错误！
INSERT INTO team_members (user_id, name, role, avatar) VALUES
('uuid1', 'User1', 'MANAGER', null)
('uuid2', 'User2', 'MEMBER', null);  -- 缺少逗号
```

**修复：** 在第一行末尾添加逗号

### ❌ 错误示例 3: UUID 类型转换问题

```sql
-- 可能在某些情况下出错
INSERT INTO team_members (user_id, name, role, avatar)
VALUES ('96d07d8e-99ee-4b69-a46e-0ce68850cff0', 'Yaohua', 'MANAGER', null);
```

**修复：** 添加 `::uuid` 类型转换

```sql
INSERT INTO team_members (user_id, name, role, avatar)
VALUES ('96d07d8e-99ee-4b69-a46e-0ce68850cff0'::uuid, 'Yaohua', 'MANAGER', null);
```

## 🎯 最佳实践

1. **优先使用方式三（通过邮箱查询）**，最安全和方便
2. **总是添加 `ON CONFLICT DO NOTHING`**，避免重复插入错误
3. **使用 `::uuid` 类型转换**，确保UUID格式正确
4. **先查询用户是否存在**，避免插入不存在的用户

## 📝 快速参考模板

```sql
-- 模板：通过邮箱插入
INSERT INTO team_members (user_id, name, role, avatar)
SELECT 
  id, 
  '姓名', 
  'MANAGER',  -- 或 'MEMBER'
  'https://ui-avatars.com/api/?name=姓名&background=0f172a&color=fff'
FROM auth.users 
WHERE email = '用户邮箱@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

