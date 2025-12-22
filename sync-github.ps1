# PowerShell 脚本：同步项目到 GitHub
# 使用方法：.\sync-github.ps1 -GitHubUsername "你的用户名" -RepoName "仓库名"

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$true)]
    [string]$RepoName
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "GitHub 同步脚本" -ForegroundColor Cyan
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

# 检查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-Host "检测到未提交的更改，正在添加..." -ForegroundColor Yellow
    git add .
    
    $commitMessage = Read-Host "请输入提交信息（直接回车使用默认信息）"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "更新项目文件"
    }
    
    git commit -m $commitMessage
    Write-Host "✓ 已提交更改" -ForegroundColor Green
} else {
    Write-Host "✓ 没有未提交的更改" -ForegroundColor Green
}

Write-Host ""

# 检查是否已有远程仓库
$remoteUrl = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "检测到已有远程仓库: $remoteUrl" -ForegroundColor Yellow
    $update = Read-Host "是否更新为新的GitHub仓库？(y/n)"
    if ($update -eq "y" -or $update -eq "Y") {
        git remote set-url origin "https://github.com/$GitHubUsername/$RepoName.git"
        Write-Host "✓ 已更新远程仓库地址" -ForegroundColor Green
    } else {
        Write-Host "保持现有远程仓库配置" -ForegroundColor Cyan
    }
} else {
    # 添加远程仓库
    Write-Host "添加远程仓库..." -ForegroundColor Yellow
    git remote add origin "https://github.com/$GitHubUsername/$RepoName.git"
    Write-Host "✓ 已添加远程仓库" -ForegroundColor Green
}

Write-Host ""

# 确保分支名为 main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "重命名分支为 main..." -ForegroundColor Yellow
    git branch -M main
    Write-Host "✓ 分支已重命名为 main" -ForegroundColor Green
}

Write-Host ""

# 推送代码
Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host ""
    Write-Host "✓✓✓ 成功！代码已推送到 GitHub ✓✓✓" -ForegroundColor Green
    Write-Host "仓库地址: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
} catch {
    Write-Host ""
    Write-Host "✗ 推送失败，可能的原因：" -ForegroundColor Red
    Write-Host "1. GitHub 仓库尚未创建，请先访问 https://github.com/new 创建仓库" -ForegroundColor Yellow
    Write-Host "2. 需要输入 GitHub 用户名和密码/Token" -ForegroundColor Yellow
    Write-Host "3. 网络连接问题" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "如果使用 Token 认证，请访问: https://github.com/settings/tokens" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

