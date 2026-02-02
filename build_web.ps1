# 构建 Web 前端并生成 Qt 资源文件 (Windows PowerShell 版本)
# @file build_web.ps1
# @description 用于 Windows CI 环境的前端构建脚本

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebDir = Join-Path $ScriptDir "src\web"
$DistDir = Join-Path $WebDir "dist"
$QrcFile = Join-Path $ScriptDir "web_resources.qrc"

Write-Host "=== 构建 Web 前端 ===" -ForegroundColor Cyan
Set-Location $WebDir
npm run build:web

Write-Host "=== 生成 Qt 资源文件 ===" -ForegroundColor Cyan
Set-Location $ScriptDir

# 生成 QRC 文件头部
$qrcContent = @"
<RCC>
    <qresource prefix="/web">
"@

# 添加所有构建产物
$files = Get-ChildItem -Path $DistDir -Recurse -File
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($ScriptDir.Length + 1)
    $aliasPath = $file.FullName.Substring($DistDir.Length + 1)
    # 统一使用正斜杠
    $relativePath = $relativePath -replace '\\', '/'
    $aliasPath = $aliasPath -replace '\\', '/'
    $qrcContent += "`n        <file alias=`"$aliasPath`">$relativePath</file>"
}

# 添加 QRC 文件尾部
$qrcContent += @"

    </qresource>
</RCC>
"@

# 写入文件
$qrcContent | Out-File -FilePath $QrcFile -Encoding UTF8

Write-Host "=== 资源文件生成完成: $QrcFile ===" -ForegroundColor Green
Get-Content $QrcFile
