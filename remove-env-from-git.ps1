# PowerShell 脚本：从Git中移除.env文件但保留本地文件
# 使用方法：.\remove-env-from-git.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "从Git缓存中移除.env文件" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否安装
try {
    $gitVersion = git --version
    Write-Host "✓ Git 已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ 错误: 未找到 Git，请先安装 Git" -ForegroundColor Red
    Write-Host "下载地址: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 要移除的文件列表
$envFiles = @(
    ".env",
    ".env.txt",
    ".env.local",
    ".env.development.local",
    ".env.test.local",
    ".env.production.local"
)

Write-Host "正在检查并移除.env相关文件..." -ForegroundColor Yellow
Write-Host ""

$removedFiles = @()

foreach ($file in $envFiles) {
    # 检查文件是否在git跟踪中
    $tracked = git ls-files --error-unmatch $file 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "找到已跟踪文件: $file" -ForegroundColor Yellow
        # 从git缓存中移除，但保留本地文件
        git rm --cached $file 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ 已从Git缓存中移除: $file" -ForegroundColor Green
            $removedFiles += $file
        } else {
            Write-Host "  ✗ 移除失败: $file" -ForegroundColor Red
        }
    } else {
        Write-Host "文件未在Git跟踪中: $file" -ForegroundColor Gray
    }
}

# 使用通配符移除所有.env.*文件
Write-Host ""
Write-Host "检查所有.env.*文件..." -ForegroundColor Yellow
$allEnvFiles = git ls-files | Where-Object { $_ -like ".env*" }
foreach ($file in $allEnvFiles) {
    if ($file -notin $removedFiles) {
        Write-Host "找到已跟踪文件: $file" -ForegroundColor Yellow
        git rm --cached $file 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ 已从Git缓存中移除: $file" -ForegroundColor Green
            $removedFiles += $file
        }
    }
}

if ($removedFiles.Count -eq 0) {
    Write-Host ""
    Write-Host "✓ 没有找到需要移除的.env文件" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "已移除 $($removedFiles.Count) 个文件：" -ForegroundColor Cyan
foreach ($file in $removedFiles) {
    Write-Host "  - $file" -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 检查更改: git status" -ForegroundColor White
Write-Host "2. 提交更改: git commit -m '移除.env文件，添加到.gitignore'" -ForegroundColor White
Write-Host "3. 推送到GitHub: git push" -ForegroundColor White
Write-Host ""
Write-Host "是否现在提交这些更改？(y/n)" -ForegroundColor Yellow
$commit = Read-Host

if ($commit -eq "y" -or $commit -eq "Y") {
    Write-Host ""
    Write-Host "正在提交更改..." -ForegroundColor Yellow
    git commit -m "移除.env文件，添加到.gitignore"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 已提交更改" -ForegroundColor Green
        Write-Host ""
        Write-Host "是否现在推送到GitHub？(y/n)" -ForegroundColor Yellow
        $push = Read-Host
        
        if ($push -eq "y" -or $push -eq "Y") {
            Write-Host ""
            Write-Host "正在推送到GitHub..." -ForegroundColor Yellow
            git push
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✓✓✓ 成功！.env文件已从GitHub仓库中移除 ✓✓✓" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "✗ 推送失败，请手动执行 git push" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✗ 提交失败" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "请手动执行以下命令完成操作：" -ForegroundColor Yellow
    Write-Host "  git commit -m '移除.env文件，添加到.gitignore'" -ForegroundColor White
    Write-Host "  git push" -ForegroundColor White
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

