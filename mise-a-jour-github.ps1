# Mise a jour complete du projet sur GitHub
# Depuis le terminal PowerShell :
#   cd D:\pfe
#   .\mise-a-jour-github.ps1
#   .\mise-a-jour-github.ps1 -Message "Mon message de commit"

param(
    [string]$Message = "Mise a jour du projet PFE"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

function Remove-GitLock {
    $lock = Join-Path $ProjectRoot ".git\index.lock"
    if (Test-Path $lock) {
        Remove-Item $lock -Force
        Write-Host "      Fichier index.lock supprime (blocage Git corrige)." -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mise a jour GitHub - Projet PFE" -ForegroundColor Cyan
Write-Host "  $ProjectRoot" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Remove-GitLock

git config user.email "165568822+montassarmlaouah@users.noreply.github.com" 2>$null
git config user.name "montassarmlaouah" 2>$null

Write-Host "[1/6] Etat du depot..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "[2/6] Ajout de tous les fichiers (git add .)..." -ForegroundColor Yellow
Remove-GitLock
git add .
if ($LASTEXITCODE -ne 0) { throw "git add a echoue" }
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

$status = git status --porcelain
if (-not $status) {
    Write-Host "[3/6] Aucun changement local a committer." -ForegroundColor Yellow
    Write-Host "[4/6] Synchronisation (git pull)..." -ForegroundColor Yellow
    git pull origin main
    Write-Host ""
    Write-Host "Depot deja a jour sur GitHub." -ForegroundColor Green
    Write-Host "https://github.com/montassarmlaouah/pfe" -ForegroundColor Cyan
    exit 0
}

Write-Host "[3/6] Commit (git commit)..." -ForegroundColor Yellow
Write-Host "      Message : $Message" -ForegroundColor DarkGray
Remove-GitLock
git commit -m $Message
if ($LASTEXITCODE -ne 0) { throw "git commit a echoue" }
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

Write-Host "[4/6] Recuperation distante (git pull origin main)..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur au pull. Resoudre les conflits puis relancer." -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

Write-Host "[5/6] Envoi vers GitHub (git push origin main)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR au push :" -ForegroundColor Red
    Write-Host "  - Verifiez Internet" -ForegroundColor Red
    Write-Host "  - Utilisez un token GitHub comme mot de passe" -ForegroundColor Red
    Write-Host "    https://github.com/settings/tokens" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[6/6] Termine !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Projet mis a jour sur GitHub" -ForegroundColor Green
Write-Host "  https://github.com/montassarmlaouah/pfe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
