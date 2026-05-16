#!/usr/bin/env bash
# fixall.sh — Full reset & restart for Clinix mobile (Expo 54 / expo-router 6)
# Run with: bash fixall.sh
# On Windows use Git Bash or WSL

set -e

echo "━━━ [1/6] Arrêt des processus Expo en cours ━━━"
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

echo "━━━ [2/6] Suppression du cache Expo (.expo/) ━━━"
rm -rf .expo/

echo "━━━ [3/6] Suppression du cache Metro (node_modules/.cache/) ━━━"
rm -rf node_modules/.cache/

echo "━━━ [4/6] Suppression de node_modules/ ━━━"
rm -rf node_modules/

echo "━━━ [5/6] Installation des dépendances (npm install) ━━━"
npm install

echo "━━━ [6/6] Démarrage Expo avec cache vidé ━━━"
# Changer --ios en --android selon votre cible
npx expo start --clear --ios
