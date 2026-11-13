#!/bin/sh
# Installe le démarrage LiteLLM de prd depuis le dépôt (depuis la racine de src) :
#   sh infra/ai/systemd/install-prd.sh [arguments ssh vers root@prd]
# défaut : rebond par fr2 sur le mesh WireGuard (clé d'hôte vérifiée sous l'IP publique de prd).
# Identifiants préalables dans /etc/credstore.encrypted : CLOUDFLARE_API_TOKEN, LITELLM_MASTER_KEY,
# ANTHROPIC_API_KEY, ANTHROPIC_WORKSPACE_ID, VERTEX_APHRODY_SA_KEY (valeur en stdin de
# `systemd-creds encrypt --name=<NOM> - /etc/credstore.encrypted/<NOM>`).
set -eu
[ $# -gt 0 ] || set -- -o BatchMode=yes -o HostKeyAlias=72.60.186.43 -J fr2 root@10.200.77.5
tar -cf - -C infra/ai ai.toml litellm-overlay.toml litellm-serve.ts systemd/ay-ai-litellm.service.d/10-creds.conf |
  ssh "$@" 'set -e; d=/usr/local/lib/aphrody-ai; install -d -m 0755 $d /etc/systemd/system/ay-ai-litellm.service.d
  tar -xf - -C $d --no-same-owner
  install -m 0644 $d/systemd/ay-ai-litellm.service.d/10-creds.conf /etc/systemd/system/ay-ai-litellm.service.d/10-creds.conf
  rm -rf $d/systemd; chmod 0644 $d/*
  systemctl daemon-reload && systemctl restart ay-ai-litellm && sleep 25 && systemctl is-active ay-ai-litellm'
