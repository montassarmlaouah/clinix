# Gérer les admins Clinix depuis votre PC (sans SSH)
# Usage : powershell -File gerer-admin-depuis-pc.ps1

$BaseUrl = "http://www.cliniix.tech"

Write-Host "=== Connexion Super Admin ===" -ForegroundColor Cyan
$body = @{ username = "super.admin"; password = "Password123!" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $login.token
if (-not $token) { Write-Host "Echec connexion"; exit 1 }
Write-Host "Connecte OK" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

Write-Host "`n=== Liste des administrateurs ===" -ForegroundColor Cyan
$admins = Invoke-RestMethod -Uri "$BaseUrl/api/administrateurs-clinique" -Headers $headers
$admins | ForEach-Object { Write-Host "- $($_.id) | $($_.nom) $($_.prenom) | $($_.telephone) | $($_.clinique.nom)" }

Write-Host "`n=== Liste des cliniques ===" -ForegroundColor Cyan
$cliniques = Invoke-RestMethod -Uri "$BaseUrl/api/cliniques" -Headers $headers
$cliniques | ForEach-Object { Write-Host "- $($_.id) | $($_.nom)" }

$action = Read-Host "`nAction ? (1=creer admin, 2=renvoyer SMS/MDP, 3=quitter)"
if ($action -eq "3") { exit 0 }

if ($action -eq "1") {
    $cliniqueId = Read-Host "ID clinique (copier ci-dessus)"
    $nom = Read-Host "Nom"
    $prenom = Read-Host "Prenom"
    $tel = Read-Host "Telephone (216XXXXXXXX)"
    $payload = @{
        nom = $nom; prenom = $prenom; telephone = $tel; cliniqueId = $cliniqueId
    } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/api/administrateurs-clinique" -Method POST -Headers $headers -ContentType "application/json" -Body $payload
    Write-Host "Admin cree : $($r.telephone)" -ForegroundColor Green
    Write-Host "Si SMS active sur le serveur, le MDP est envoye par SMS."
}

if ($action -eq "2") {
    $adminId = Read-Host "ID admin (copier ci-dessus)"
    try {
        $r = Invoke-RestMethod -Uri "$BaseUrl/api/administrateurs-clinique/$adminId/reinitialiser-mot-de-passe" -Method POST -Headers $headers
        if ($r.smsEnvoye) {
            Write-Host $r.message -ForegroundColor Green
        } else {
            Write-Host $r.message -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Erreur : l'endpoint n'est peut-etre pas encore deploye sur le serveur." -ForegroundColor Red
        Write-Host "Utilisez l'option 1 apres activation SMS, ou mot de passe oublie sur /login"
    }
}
