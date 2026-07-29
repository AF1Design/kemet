$gitExe = 'C:\Users\Ts\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe'
$targetDir = 'c:\Users\Ts\Desktop\kemet'

# 1. Remove old .git tracking completely
if (Test-Path "$targetDir\.git") {
    Remove-Item -Recurse -Force "$targetDir\.git" -ErrorAction SilentlyContinue
}

# 2. Ensure .gitignore is strictly written
$gitignoreContent = @"
/node_modules
/.pnp
.pnp.js
/.next/
/out/
/build
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env*.local
.env
.vercel
.DS_Store
Thumbs.db
"@
Set-Content -Path "$targetDir\.gitignore" -Value $gitignoreContent -Encoding UTF8

# 3. Re-initialize git fresh
Set-Location $targetDir
& $gitExe init
& $gitExe branch -M main
& $gitExe add .
& $gitExe commit -m "KEMET Official Store - Fresh Release"

Write-Host "SUCCESS: Git repository completely wiped fresh and clean commit created!"
