#!/usr/bin/env bash
# Diagnostic et reparation du backend Clinix sur Contabo.
# Usage (VNC ou SSH) : bash /opt/clinix/backend/scripts/reparer-backend-serveur.sh

set -euo pipefail

REPO_DIR="/opt/clinix"
BACKEND_DIR="${REPO_DIR}/backend"
JAR="${BACKEND_DIR}/target/pfe-0.0.1-SNAPSHOT.jar"
SERVICE_NAME="${CLINIX_SERVICE:-clinix-backend}"
DB_USER="${POSTGRES_USER:-clinix}"
DB_PASS="${POSTGRES_PASSWORD:-Clinix2026Secure!}"
DB_NAME="${POSTGRES_DB:-PFE2}"

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "=== 1. Etat service ==="
systemctl status "${SERVICE_NAME}" --no-pager 2>/dev/null || log "Service ${SERVICE_NAME} introuvable"

log "=== 2. Test PostgreSQL ==="
if PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1 AS ok;" 2>/dev/null; then
  log "PostgreSQL OK"
else
  log "ERREUR PostgreSQL — verifiez utilisateur/mot de passe/base"
  log "  sudo -u postgres psql -c \"\\du\""
fi

log "=== 3. Derniers logs backend ==="
journalctl -u "${SERVICE_NAME}" -n 40 --no-pager 2>/dev/null || tail -40 /var/log/clinix-backend.log 2>/dev/null || true

log "=== 4. Installation service systemd (si absent) ==="
if [[ -f "${BACKEND_DIR}/deploy/clinix-backend.service" ]]; then
  cp "${BACKEND_DIR}/deploy/clinix-backend.service" "/etc/systemd/system/${SERVICE_NAME}.service"
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}" 2>/dev/null || true
fi

log "=== 5. Recompilation JAR (si source presente) ==="
if [[ -f "${BACKEND_DIR}/mvnw" ]]; then
  cd "${BACKEND_DIR}"
  chmod +x mvnw
  ./mvnw -DskipTests package -q
fi

if [[ ! -f "${JAR}" ]]; then
  log "ERREUR: JAR introuvable — ${JAR}"
  exit 1
fi

log "=== 6. Redemarrage backend ==="
systemctl restart "${SERVICE_NAME}" 2>/dev/null || {
  pkill -f 'pfe-0.0.1-SNAPSHOT.jar' 2>/dev/null || true
  nohup java -jar "${JAR}" --spring.profiles.active=prod > /var/log/clinix-backend.log 2>&1 &
}
sleep 10

log "=== 7. Tests ==="
HEALTH=$(curl -sf http://localhost:8080/api/health || echo FAIL)
log "Health: ${HEALTH}"

LOGIN=$(curl -sf -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super.admin","password":"Password123!"}' || echo FAIL)
if echo "${LOGIN}" | grep -q '"token"'; then
  log "Login Super Admin OK"
else
  log "ERREUR Login: ${LOGIN}"
  log "Consultez: journalctl -u ${SERVICE_NAME} -n 100 --no-pager"
  exit 1
fi

log "=== BACKEND REPARE ==="
