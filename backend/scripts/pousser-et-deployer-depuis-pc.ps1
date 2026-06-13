# Pousse le code vers GitHub puis met a jour le serveur Contabo.
# Prerequis : SSH fonctionne OU utilisez le script manuellement via VNC.
# Usage : powershell -ExecutionPolicy Bypass -File pousser-et-deployer-depuis-pc.ps1

$Server = "root@13.140.157.238"
$RepoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

Set-Location $RepoRoot

Write-Host "=== 1. Git status ===" -ForegroundColor Cyan
git status -sb

$confirm = Read-Host "Pousser les modifications vers GitHub et deployer ? (o/n)"
if ($confirm -ne "o") { exit 0 }

Write-Host "=== 2. Commit (si modifications) ===" -ForegroundColor Cyan
$changes = git status --porcelain
if ($changes) {
    git add -A
    $msg = Read-Host "Message de commit"
    if (-not $msg) { $msg = "Mise a jour deploy serveur Contabo" }
    git commit -m $msg
}

Write-Host "=== 3. Push GitHub ===" -ForegroundColor Cyan
git push origin main

Write-Host "=== 4. Mise a jour serveur ===" -ForegroundColor Cyan
$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_clinix"
$sshArgs = @()
if (Test-Path $sshKey) { $sshArgs += "-i", $sshKey }

ssh @sshArgs $Server @"
cd /opt/clinix
git pull origin main
chmod +x backend/scripts/mise-a-jour-serveur.sh 2>/dev/null || true
bash backend/scripts/mise-a-jour-serveur.sh
"@

Write-Host "=== Termine ===" -ForegroundColor Green
Write-Host "Test : http://www.cliniix.tech/api/health"
