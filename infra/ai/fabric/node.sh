#!/bin/sh
# Nœud de calcul du tissu d'inférence (Linux) : ggml-rpc-server officiel de llama.cpp, lié à une adresse
# WireGuard, dans une unité systemd transitoire plafonnée, retirée seule quand sa condition d'admission tombe.
# Installé et piloté par packages/ai-os/src/fabric (`ai-os fabric up|status|down`), jamais à la main :
#   env TAG= ASSET= SHA= BIND= PORT= THREADS= CPU= MEM= GATE= LOCK= PRIO= WATCH= COORD= sh node.sh <action>
# Actions : gate (code 0 = admis, sinon raison sur stdout), up, down, status (une ligne JSON), watch (unité),
#   warm (MODEL_URL MODEL_SHA MODEL_FILE) : GGUF tiré au débit du centre de données, vérifié, puis chargé une fois
#   par la boucle locale pour remplir le cache de tenseurs de rpc-server ; le coordinateur n'envoie ensuite que des
#   empreintes pour les tenseurs de plus de 10 Mio (HASH_THRESHOLD de ggml-rpc.cpp).
# GATE : no-build (fr1), prd (charge, verrou lourd, service prioritaire, mémoire), proxy (fr2), always.
set -eu
UNIT=aphrody-rpc
ROOT=/opt/aphrody
BIN_DIR="$ROOT/llama.cpp/${TAG:-none}"
CACHE=/var/cache/aphrody-rpc
STATE=/run/aphrody-rpc.state
nproc_=$(nproc)
half=$((nproc_ / 2))

load1() { cut -d' ' -f1 /proc/loadavg; }
# Charge extérieure : en cours d'exécution, on retire au plus nos propres fils (plafonnés par CPUQuota).
load_ok() {
  own=${1:-0}
  awk -v l="$(load1)" -v o="$own" -v h="$half" 'BEGIN { exit !((l - o) < h) }'
}
mem_avail_mb() { awk '/^MemAvailable:/ { print int($2 / 1024) }' /proc/meminfo; }
mem_need_mb() { echo "${MEM:-2G}" | awk '{ v = $1 + 0; u = substr($1, length($1)); if (u == "G") v *= 1024; print v + 2048 }'; }
building() { pgrep -x 'ninja|autoninja|siso|reproxy|clang|clang\+\+|cc1plus|rustc|ld\.lld|lld-link' >/dev/null 2>&1; }

# Raison du refus sur stdout, code 1 ; rien et code 0 si admis. $1 = fils propres à ignorer (watch).
gate() {
  own=${1:-0}
  case "${GATE:-always}" in
    always) ;;
    no-build)
      building && { echo "build Chromium/LLVM en cours"; return 1; }
      load_ok "$own" || { echo "charge $(load1) >= $half"; return 1; } ;;
    proxy)
      systemctl is-active --quiet nginx || { echo "nginx inactif : le proxy passe d'abord"; return 1; }
      load_ok "$own" || { echo "charge $(load1) >= $half"; return 1; } ;;
    prd)
      load_ok "$own" || { echo "charge $(load1) >= $half"; return 1; }
      if [ -n "${PRIO:-}" ]; then
        code=$(curl -s -m 3 -o /dev/null -w '%{http_code}' "$PRIO" || true)
        [ "$code" = 200 ] || { echo "service prioritaire $PRIO : HTTP $code"; return 1; }
      fi
      [ "$(mem_avail_mb)" -ge "$(mem_need_mb)" ] || { echo "mémoire disponible $(mem_avail_mb) Mio < $(mem_need_mb) Mio"; return 1; }
      if [ "$own" = 0 ] && [ -n "${LOCK:-}" ]; then
        ( exec 9>"$LOCK"; flock -n 9 ) || { echo "verrou lourd $LOCK pris"; return 1; }
      fi ;;
    *) echo "gate inconnue : $GATE"; return 1 ;;
  esac
  return 0
}

rpc_bin() { find "$BIN_DIR" -maxdepth 3 -type f \( -name ggml-rpc-server -o -name rpc-server \) | head -n1; }

install_bin() {
  [ -n "$(rpc_bin 2>/dev/null || true)" ] && return 0
  tmp=$(mktemp -d)
  curl -fsSL -o "$tmp/a.tgz" "https://github.com/ggml-org/llama.cpp/releases/download/$TAG/$ASSET"
  echo "$SHA  $tmp/a.tgz" | sha256sum -c --quiet - || { echo "sha256 invalide pour $ASSET" >&2; rm -rf "$tmp"; exit 2; }
  mkdir -p "$BIN_DIR"
  tar -xzf "$tmp/a.tgz" -C "$BIN_DIR"
  rm -rf "$tmp"
  [ -n "$(rpc_bin)" ] || { echo "ggml-rpc-server absent de $ASSET" >&2; exit 2; }
}

nft_on() {
  command -v nft >/dev/null 2>&1 || { echo "nft absent : seule l'adresse d'écoute WireGuard protège le port" >&2; return 0; }
  nft delete table inet aphrody_rpc 2>/dev/null || true
  nft -f - <<EOF
table inet aphrody_rpc {
  chain input {
    type filter hook input priority -10; policy accept;
    tcp dport $PORT ip saddr != { ${COORD:-10.200.77.2}, $BIND } drop
  }
}
EOF
}
nft_off() { command -v nft >/dev/null 2>&1 && nft delete table inet aphrody_rpc 2>/dev/null || true; }

# Corps de l'unité : rpc-server en arrière-plan, chien de garde au premier plan.
watch() {
  bin=$(rpc_bin)
  mkdir -p "$CACHE"
  LLAMA_CACHE="$CACHE" GGML_RPC_NO_RDMA=1 "$bin" -H "$BIND" -p "$PORT" -t "${THREADS:-2}" -c &
  pid=$!
  trap 'kill $pid 2>/dev/null; wait $pid 2>/dev/null; nft_off; exit 0' TERM INT
  echo "up $(date -u +%FT%TZ)" > "$STATE"
  while kill -0 "$pid" 2>/dev/null; do
    sleep "${WATCH:-10}"
    if why=$(gate "${THREADS:-2}"); then :; else
      echo "retrait $(date -u +%FT%TZ) : $why" | tee "$STATE"
      kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null || true
      nft_off
      exit 0
    fi
  done
  echo "fin $(date -u +%FT%TZ) : rpc-server terminé" > "$STATE"
  nft_off
}

up() {
  if systemctl is-active --quiet "$UNIT"; then echo "déjà actif"; return 0; fi
  why=$(gate) || { echo "refus : $why"; exit 75; }
  install_bin
  nft_on
  systemctl reset-failed "$UNIT" 2>/dev/null || true
  set -- systemd-run --unit "$UNIT" --collect --quiet \
    -p CPUQuota="${CPU:-100%}" -p MemoryMax="${MEM:-2G}" -p MemorySwapMax=0 -p CPUWeight=10 \
    -p Nice=19 -p IOSchedulingClass=idle -p IOWeight=10 -p OOMScoreAdjust=900 \
    --setenv=TAG="$TAG" --setenv=BIND="$BIND" --setenv=PORT="$PORT" --setenv=THREADS="${THREADS:-2}" \
    --setenv=GATE="${GATE:-always}" --setenv=PRIO="${PRIO:-}" --setenv=WATCH="${WATCH:-10}" \
    --setenv=MEM="${MEM:-2G}" --setenv=COORD="${COORD:-}"
  # prd : le verrou lourd est tenu pendant toute la vie de l'unité (un seul travail lourd à la fois).
  if [ -n "${LOCK:-}" ]; then
    "$@" flock -n "$LOCK" sh "$ROOT/fabric/node.sh" watch
  else
    "$@" sh "$ROOT/fabric/node.sh" watch
  fi
  sleep 2
  systemctl is-active --quiet "$UNIT" || { echo "échec : $(cat "$STATE" 2>/dev/null)"; journalctl -u "$UNIT" -n 20 --no-pager; exit 1; }
  echo "actif sur $BIND:$PORT"
}

MODELS=/var/cache/aphrody-models
warm() {
  systemctl is-active --quiet "$UNIT" || { echo "rpc-server inactif : up d'abord"; exit 1; }
  mkdir -p "$MODELS"
  f="$MODELS/$MODEL_FILE"
  if ! echo "$MODEL_SHA  $f" | sha256sum -c --quiet - 2>/dev/null; then
    nice -n 19 ionice -c3 curl -fsSL -o "$f.part" "$MODEL_URL"
    echo "$MODEL_SHA  $f.part" | sha256sum -c --quiet - || { rm -f "$f.part"; echo "sha256 invalide : $MODEL_URL"; exit 2; }
    mv "$f.part" "$f"
  fi
  cli=$(find "$BIN_DIR" -maxdepth 3 -type f -name llama-completion | head -n1)
  systemd-run --unit aphrody-rpc-warm --collect --wait --quiet \
    -p CPUQuota="${CPU:-100%}" -p MemoryMax="${MEM:-2G}" -p Nice=19 -p IOSchedulingClass=idle \
    "$cli" -m "$f" --rpc "$BIND:$PORT" -ngl 999 -n 1 -p ok --no-warmup -t 1 >/dev/null 2>&1 || true
  echo "cache : $(du -sm "$CACHE" | cut -f1) Mio dans $CACHE"
}

down() { systemctl stop "$UNIT" 2>/dev/null || true; nft_off; echo "arrêté"; }

status() {
  active=$(systemctl is-active "$UNIT" 2>/dev/null || true)
  own=0; [ "$active" = active ] && own=${THREADS:-2}
  why=$(gate "$own" 2>/dev/null) && admit=true || admit=false
  props=$(systemctl show "$UNIT" -p MemoryCurrent -p MemoryPeak -p CPUUsageNSec -p CPUQuotaPerSecUSec -p MemoryMax 2>/dev/null | tr '\n' ' ')
  st=$(cat "$STATE" 2>/dev/null || true)
  printf '{"active":"%s","admit":%s,"reason":"%s","load1":%s,"nproc":%s,"mem_avail_mb":%s,"unit":"%s","state":"%s"}\n' \
    "$active" "$admit" "$why" "$(load1)" "$nproc_" "$(mem_avail_mb)" "$props" "$st"
}

case "${1:-status}" in
  gate) why=$(gate) && echo admis || { echo "$why"; exit 1; } ;;
  up) up ;;
  down) down ;;
  status) status ;;
  watch) watch ;;
  warm) warm ;;
  *) echo "action inconnue : $1" >&2; exit 64 ;;
esac
