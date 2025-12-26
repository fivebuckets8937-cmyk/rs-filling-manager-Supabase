# 数据迁移指南

## 从 localStorage 迁移到 Supabase

如果你之前使用 localStorage 存储数据，可以使用以下方法迁移到 Supabase。

## 方法 1：浏览器控制台迁移（推荐）

这是最简单的方法，适合一次性迁移：

1. **登录应用**
   - 打开应用并登录
   - 确保 localStorage 中有数据

2. **打开浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签

3. **运行迁移代码**
   - 复制 `scripts/migrateFromLocalStorage.ts` 中的 `migrateFromLocalStorageBrowser` 函数
   - 或者使用 `getMigrationCode()` 获取完整的浏览器代码
   - 粘贴到控制台并执行

4. **验证迁移结果**
   - 刷新页面
   - 检查任务是否正常显示
   - 确认数据已保存到 Supabase

## 方法 2：手动迁移

如果浏览器控制台方法不可用，可以手动迁移：

1. **导出 localStorage 数据**
   ```javascript
   // 在浏览器控制台运行
   const tasksKey = Object.keys(localStorage).find(k => k.startsWith('rs_tasks_'));
   const tasks = JSON.parse(localStorage.getItem(tasksKey) || '[]');
   console.log(JSON.stringify(tasks, null, 2));
   // 复制输出的 JSON
   ```

2. **在 Supabase Dashboard 中导入**
   - 打开 Supabase Dashboard > SQL Editor
   - 使用导出的 JSON 数据创建 INSERT 语句
   - 执行 SQL 插入数据

## 注意事项

- **备份数据**：迁移前建议备份 localStorage 数据
- **用户关联**：确保迁移的任务关联到正确的 team_member
- **数据验证**：迁移后检查数据完整性
- **清理旧数据**：迁移成功后可以清理 localStorage（可选）

## 故障排除

### 问题：迁移后看不到任务

**可能原因：**
- RLS 策略阻止了数据访问
- 任务没有正确关联到 team_member

**解决方案：**
- 检查 RLS 策略是否正确配置
- 确认任务的 `created_by` 字段指向正确的 team_member ID

### 问题：进度数据丢失

**可能原因：**
- task_progress 表数据未正确迁移

**解决方案：**
- 检查 task_progress 表中是否有对应记录
- 重新运行迁移脚本

