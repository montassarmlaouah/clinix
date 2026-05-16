@echo off
chcp 65001 >nul
title Mise a jour GitHub - PFE
cd /d "%~dp0"

echo.
echo ========================================
echo   Mise a jour GitHub - Projet PFE
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mise-a-jour-github.ps1" %*

if errorlevel 1 (
    echo.
    echo Echec de la mise a jour.
    pause
    exit /b 1
)

echo.
pause
