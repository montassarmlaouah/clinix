#!/usr/bin/env bash
# Mise a jour complete du code Clinix sur le serveur Contabo.
# A executer sur le serveur (SSH ou VNC) :
#   bash /opt/clinix/backend/scripts/mise-a-jour-serveur.sh

set -euo pipefail

REPO_DIR="/opt/clinix"
BACKEND_DIR="${REPO_DIR}/backend"
FRONTEND_DIR="${REPO_DIR}/Frontend"
WEB_DIR="/var/www/clinix"
SERVICE_NAME="${CLINIX_SERVICE:-clinix-backend}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  log "Clone initial du depot..."
  mkdir -p "${REPO_DIR}"
  git clone https://github.com/montassarmlaouah/clinix.git "${REPO_DIR}"
fi

cd "${REPO_DIR}"
log "git pull..."
git pull origin main

log "Compilation backend (Maven)..."
cd "${BACKEND_DIR}"
chmod +x mvnw 2>/dev/null || true
./mvnw -DskipTests package -q
test -f target/pfe-0.0.1-SNAPSHOT.jar || { log "ERREUR: JAR introuvable"; exit 1; }

log "Compilation frontend (Angular)..."
cd "${FRONTEND_DIR}"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
npm run build

BUILD_OUT="${FRONTEND_DIR}/dist/pfe/browser"
if [[ ! -d "${BUILD_OUT}" ]]; then
  log "ERREUR: build frontend introuvable (${BUILD_OUT})"
  exit 1
fi

log "Deploiement fichiers statiques Nginx..."
mkdir -p "${WEB_DIR}"
rm -rf "${WEB_DIR:?}"/*
cp -r "${BUILD_OUT}"/* "${WEB_DIR}/"
chown -R www-data:www-data "${WEB_DIR}" 2>/dev/null || true
chmod -R 755 "${WEB_DIR}"

log "Redemarrage backend..."
if [[ -f "${BACKEND_DIR}/deploy/clinix-backend.service" ]]; then
  cp "${BACKEND_DIR}/deploy/clinix-backend.service" "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}" 2>/dev/null || true
fi
if systemctl list-unit-files | grep -q "${SERVICE_NAME}"; then
  systemctl restart "${SERVICE_NAME}"
else
  log "Service ${SERVICE_NAME} absent — demarrage manuel du JAR si besoin."
  pkill -f 'pfe-0.0.1-SNAPSHOT.jar' 2>/dev/null || true
  nohup java -jar "${BACKEND_DIR}/target/pfe-0.0.1-SNAPSHOT.jar" \
    --spring.profiles.active=prod > /var/log/clinix-backend.log 2>&1 &
fi

sleep 10

log "Test login Super Admin..."
LOGIN=$(curl -sf -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super.admin","password":"Password123!"}' || echo FAIL)
if ! echo "${LOGIN}" | grep -q '"token"'; then
  log "ATTENTION: health OK mais login echoue — lancez reparer-backend-serveur.sh"
  log "Detail login: ${LOGIN}"
fi

if systemctl is-active --quiet nginx 2>/dev/null; then
  nginx -t && systemctl reload nginx
fi

log "Verification sante API..."
HEALTH=$(curl -sf http://localhost:8080/api/health || echo "FAIL")
log "Health: ${HEALTH}"

if echo "${HEALTH}" | grep -q '"status":"UP"'; then
  log "=== MISE A JOUR OK ==="
  log "Site : http://www.cliniix.tech"
else
  log "=== ATTENTION: backend peut ne pas etre demarre ==="
  log "Verifiez : systemctl status ${SERVICE_NAME}"
  log "Ou logs  : journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
  exit 1
fi
