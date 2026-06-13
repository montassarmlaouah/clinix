#!/usr/bin/env bash
# A executer DANS le terminal VNC Contabo (quand SSH ne marche pas depuis le PC).
# Usage :
#   1. Ouvrir VNC sur my.contabo.com
#   2. Se connecter en root
#   3. Coller la cle publique affichee par generer-cle-ssh-windows.ps1
#   4. bash /opt/clinix/backend/scripts/configurer-acces-ssh-vnc.sh "ssh-ed25519 AAAA..."

set -euo pipefail

PUBKEY="${1:-}"

echo "=== Reparation SSH Contabo / Clinix ==="

# Shell root valide
if ! grep -q '^root:.*:/bin/bash' /etc/passwd; then
  usermod -s /bin/bash root
  echo "Shell root corrige -> /bin/bash"
fi

# Supprimer un exit premature dans .bashrc
for f in /root/.bashrc /root/.profile /root/.bash_profile; do
  if [[ -f "$f" ]] && grep -q '^exit 0' "$f"; then
    sed -i '/^exit 0/d' "$f"
    echo "Suppression 'exit 0' dans $f"
  fi
done

# SSH : mot de passe + root + cles
SSHD="/etc/ssh/sshd_config"
cp -a "$SSHD" "${SSHD}.bak.$(date +%Y%m%d%H%M%S)"

ensure_opt() {
  local key="$1"
  local val="$2"
  if grep -qE "^#?${key}" "$SSHD"; then
    sed -i "s/^#?${key}.*/${key} ${val}/" "$SSHD"
  else
    echo "${key} ${val}" >> "$SSHD"
  fi
}

ensure_opt "PasswordAuthentication" "yes"
ensure_opt "PermitRootLogin" "yes"
ensure_opt "PubkeyAuthentication" "yes"
ensure_opt "MaxAuthTries" "6"

mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

if [[ -n "$PUBKEY" ]]; then
  if ! grep -qF "$PUBKEY" /root/.ssh/authorized_keys; then
    echo "$PUBKEY" >> /root/.ssh/authorized_keys
    echo "Cle publique ajoutee."
  else
    echo "Cle publique deja presente."
  fi
else
  echo "Aucune cle passee en argument — mot de passe SSH seulement."
  echo "Relancez avec : bash $0 'ssh-ed25519 AAAA...'"
fi

# Debloquer fail2ban si installe
if command -v fail2ban-client >/dev/null 2>&1; then
  fail2ban-client unban --all 2>/dev/null || true
  echo "fail2ban : bans leves."
fi

# Pare-feu : port 22 ouvert
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

systemctl restart ssh || systemctl restart sshd
systemctl enable ssh || systemctl enable sshd

echo ""
echo "=== OK — Testez depuis votre PC ==="
echo "  ssh root@13.140.157.238"
echo "  ou avec cle : ssh -i ~/.ssh/id_ed25519_clinix root@13.140.157.238"
