# Git 快速参考指南

## 📝 日常开发工作流

### 标准提交流程（最常用）
```bash
# 1. 查看修改了哪些文件
git status

# 2. 添加所有更改
git add .

# 3. 提交更改（填写有意义的提交信息）
git commit -m "描述你做了什么改动"

# 4. 推送到GitHub
git push
```

### 🚀 一键脚本（最简单）
```powershell
# 运行脚本，按提示操作
.\commit-and-push.ps1
```

---

## 📋 常用命令速查

### 查看状态和信息
| 命令 | 说明 |
|------|------|
| `git status` | 查看哪些文件被修改 |
| `git diff` | 查看具体修改内容 |
| `git log` | 查看提交历史 |
| `git log --oneline` | 简洁模式查看历史 |

### 添加和提交
| 命令 | 说明 |
|------|------|
| `git add .` | 添加所有更改 |
| `git add 文件名` | 添加特定文件 |
| `git commit -m "信息"` | 提交更改 |
| `git commit --amend` | 修改最后一次提交 |

### 推送和拉取
| 命令 | 说明 |
|------|------|
| `git push` | 推送到GitHub |
| `git pull` | 从GitHub拉取更新 |
| `git fetch` | 获取远程更新（不合并） |

### 撤销操作
| 命令 | 说明 |
|------|------|
| `git restore 文件` | 撤销文件的修改（未提交） |
| `git restore .` | 撤销所有修改（未提交） |
| `git reset HEAD~1` | 撤销最后一次提交（保留修改） |

---

## 🎯 常见场景

### ✅ 场景1：正常提交修改
```bash
git add .
git commit -m "修复登录bug"
git push
```

### ✅ 场景2：只提交特定文件
```bash
git add src/App.tsx
git add src/components/Login.tsx
git commit -m "更新登录组件"
git push
```

### ✅ 场景3：提交信息写错了，想修改
```bash
git commit --amend -m "正确的提交信息"
git push --force  # 注意：如果已推送，需要强制推送
```

### ✅ 场景4：想撤销刚才的修改（还没提交）
```bash
git restore 文件名  # 撤销单个文件
# 或
git restore .      # 撤销所有修改
```

### ✅ 场景5：忘记添加某个文件到上次提交
```bash
git add 忘记的文件
git commit --amend --no-edit  # 不修改提交信息
git push --force
```

---

## ⚠️ 注意事项

1. **提交前检查**：使用 `git status` 查看要提交的文件
2. **提交信息**：写清楚做了什么改动，方便以后查看
3. **敏感信息**：确保 `.env` 等文件在 `.gitignore` 中
4. **定期推送**：不要积累太多未推送的提交

---

## 🆘 遇到问题？

### 推送被拒绝
```bash
# 先拉取远程更新
git pull

# 如果有冲突，解决冲突后
git add .
git commit -m "解决冲突"
git push
```

### 想查看远程仓库地址
```bash
git remote -v
```

### 想更新远程仓库地址
```bash
git remote set-url origin https://github.com/用户名/仓库名.git
```

---

## 💡 提交信息模板

```
功能：描述新功能
修复：描述修复的bug
优化：描述性能优化
文档：描述文档更新
样式：描述UI/样式改动
重构：描述代码重构
```

**示例：**
- `git commit -m "功能：添加用户登录功能"`
- `git commit -m "修复：解决任务列表不显示的问题"`
- `git commit -m "优化：减少API调用次数"`
- `git commit -m "文档：更新README部署说明"`

