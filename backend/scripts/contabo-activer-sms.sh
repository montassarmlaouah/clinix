#!/usr/bin/env bash
# Active TunisieSMS sur le serveur Contabo et redémarre le backend Clinix.
# Usage (sur le VPS, en root) :
#   export TUNISIESMS_API_KEY='votre_cle_mystudents'
#   bash /opt/clinix/backend/scripts/contabo-activer-sms.sh

set -euo pipefail

SERVICE_NAME="${CLINIX_SERVICE:-clinix-backend}"
OVERRIDE_DIR="/etc/systemd/system/${SERVICE_NAME}.service.d"
OVERRIDE_FILE="${OVERRIDE_DIR}/tunisiesms.conf"

if [[ -z "${TUNISIESMS_API_KEY:-}" ]]; then
  echo "ERREUR: définissez TUNISIESMS_API_KEY avant d'exécuter ce script."
  echo "  export TUNISIESMS_API_KEY='votre_cle'"
  exit 1
fi

mkdir -p "${OVERRIDE_DIR}"
cat > "${OVERRIDE_FILE}" <<EOF
[Service]
Environment=SPRING_PROFILES_ACTIVE=prod
Environment=TUNISIESMS_ENABLED=true
Environment=TUNISIESMS_API_KEY=${TUNISIESMS_API_KEY}
Environment=TUNISIESMS_SENDER=${TUNISIESMS_SENDER:-TunSMS Test}
Environment=TUNISIESMS_API_TYPE=${TUNISIESMS_API_TYPE:-55}
EOF

systemctl daemon-reload
systemctl restart "${SERVICE_NAME}"

echo "Attente du démarrage..."
sleep 5
curl -sf http://localhost:8080/api/health || { echo "Backend non joignable"; exit 1; }

echo ""
echo "Vérification des logs TunisieSMS :"
journalctl -u "${SERVICE_NAME}" -n 30 --no-pager | grep -i TunisieSMS || true

echo ""
echo "SMS activé. Pour réinitialiser un admin :"
echo "  POST https://www.cliniix.tech/api/administrateurs-clinique/{id}/reinitialiser-mot-de-passe"
echo "  Authorization: Bearer <token_super_admin>"
