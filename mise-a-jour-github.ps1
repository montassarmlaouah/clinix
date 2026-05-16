# Mise à jour complète du projet sur GitHub
# Usage : .\mise-a-jour-github.ps1
#         .\mise-a-jour-github.ps1 -Message "Correction design technicien"

param(
    [string]$Message = "Mise à jour complète du projet - corrections et améliorations"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mise à jour GitHub - Projet PFE" -ForegroundColor Cyan
Write-Host "  $ProjectRoot" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Identité Git (email noreply GitHub)
git config user.email "165568822+montassarmlaouah@users.noreply.github.com" 2>$null
git config user.name "montassarmlaouah" 2>$null

Write-Host "[1/5] Etat du depot..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "[2/5] Ajout de tous les fichiers..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) { throw "git add a echoue" }
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

# Rien à committer
$status = git status --porcelain
if (-not $status) {
    Write-Host "Aucun changement a envoyer." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[3/5] Synchronisation avec GitHub (pull)..." -ForegroundColor Yellow
    git pull origin main
    Write-Host ""
    Write-Host "Termine. Le depot local est deja a jour." -ForegroundColor Green
    exit 0
}

Write-Host "[3/5] Creation du commit..." -ForegroundColor Yellow
Write-Host "      Message : $Message" -ForegroundColor DarkGray
git commit -m $Message
if ($LASTEXITCODE -ne 0) { throw "git commit a echoue" }
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Recuperation des changements distants (pull)..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ATTENTION : conflit ou erreur au pull. Resoudre puis relancer ce script." -ForegroundColor Red
    exit 1
}
Write-Host "      OK" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Envoi vers GitHub (push)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERREUR au push. Verifiez :" -ForegroundColor Red
    Write-Host "  - Connexion Internet" -ForegroundColor Red
    Write-Host "  - Token GitHub (Settings > Developer settings > Personal access tokens)" -ForegroundColor Red
    Write-Host "  - Fichiers trop volumineux (backend/target/, node_modules/ doivent etre dans .gitignore)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Mise a jour terminee avec succes !" -ForegroundColor Green
Write-Host "  https://github.com/montassarmlaouah/pfe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
