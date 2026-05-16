@echo off
REM Commandes Git pour le terminal CMD - double-clic ou: push-github.cmd
chcp 65001 >nul
title Push GitHub - PFE
cd /d "%~dp0"

echo.
echo === Mise a jour GitHub (CMD) ===
echo Dossier: %CD%
echo.

if exist ".git\index.lock" (
    echo Suppression de index.lock...
    del /f ".git\index.lock"
)

git config user.email "165568822+montassarmlaouah@users.noreply.github.com"
git config user.name "montassarmlaouah"

echo [1] git add .
git add .
if errorlevel 1 goto erreur

echo [2] git commit
git commit -m "Mise a jour du projet PFE"
if errorlevel 1 (
    echo Note: rien a committer ou commit deja fait.
)

echo [3] git pull origin main
git pull origin main
if errorlevel 1 goto erreur

echo [4] git push origin main
git push origin main
if errorlevel 1 goto erreur

echo.
echo OK - https://github.com/montassarmlaouah/pfe
echo.
pause
exit /b 0

:erreur
echo.
echo ERREUR. Essayez: mise-a-jour-github.bat
echo.
pause
exit /b 1
