# Genere une cle SSH sur Windows pour acceder au VPS Contabo sans mot de passe.
# Usage : powershell -ExecutionPolicy Bypass -File generer-cle-ssh-windows.ps1

$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_clinix"

if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" | Out-Null
}

if (Test-Path $KeyPath) {
    Write-Host "Cle existante : $KeyPath" -ForegroundColor Yellow
} else {
    ssh-keygen -t ed25519 -f $KeyPath -N '""' -C "clinix-contabo"
    Write-Host "Cle creee : $KeyPath" -ForegroundColor Green
}

Write-Host "`n=== CLE PUBLIQUE (a copier dans Contabo VNC) ===" -ForegroundColor Cyan
Get-Content "$KeyPath.pub"
Write-Host "`n=== COMMANDE SSH apres configuration ===" -ForegroundColor Cyan
Write-Host "ssh -i `"$KeyPath`" root@13.140.157.238"
