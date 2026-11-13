#!/usr/bin/env bash
# Cluster private CA (key stays on the PC, outside git) + per-member certificate.
# The member key is generated on the member and never leaves it; only CSR and certificate travel.
# Usage: infra/cluster/pki.sh <member> [ssh-alias]  (just cluster-pki <member>); renewal = rerun.
#        infra/cluster/pki.sh client <ssh-alias|local> [user]  (client cert for ssh over the mesh)
set -euo pipefail
OPENSSL=${OPENSSL:-$(command -v openssl || echo "/c/Program Files/Git/usr/bin/openssl.exe")}
domain=cluster.internal; ca=${APHRODY_CLUSTER_CA:-$HOME/.local/share/aphrody/cluster-ca}
# Client certificate (ssh over the mesh): infra/cluster/pki.sh client <ssh-alias|local> [user]
# Key generated where it is used (~user/.config/aphrody-cluster/client.pem), never copied.
if [ "${1:-}" = client ]; then
  tgt=$2; user=${3:-$(whoami)}
  ext=$(mktemp); printf 'extendedKeyUsage=clientAuth\nkeyUsage=critical,digitalSignature\nbasicConstraints=critical,CA:FALSE\n' > "$ext"
  if [ "$tgt" = local ]; then
    d="$HOME/.config/aphrody-cluster"; mkdir -p "$d"
    [ -f "$d/client.key" ] || MSYS_NO_PATHCONV=1 "$OPENSSL" genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out "$d/client.key"
    MSYS_NO_PATHCONV=1 "$OPENSSL" req -new -key "$d/client.key" -subj "/CN=$user@pc.$domain" -out "$d/client.csr"
    MSYS_NO_PATHCONV=1 "$OPENSSL" x509 -req -in "$d/client.csr" -CA "$ca/ca.pem" -CAkey "$ca/ca.key" -CAcreateserial -days 397 -sha256 -extfile "$ext" -out "$d/client.crt" 2>/dev/null
    cat "$d/client.crt" "$d/client.key" > "$d/client.pem"; cp "$ca/ca.pem" "$d/ca.pem"; rm -f "$d/client.csr"
    echo "client $user@pc ok"
  else
    csr=$(timeout 60 ssh "$tgt" "sudo -u $user sh -c 'd=\$HOME/.config/aphrody-cluster; mkdir -p \$d; chmod 700 \$d; test -f \$d/client.key || openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out \$d/client.key; chmod 600 \$d/client.key; openssl req -new -key \$d/client.key -subj /CN=$user@$tgt.$domain'")
    crt=$(printf '%s\n' "$csr" | MSYS_NO_PATHCONV=1 "$OPENSSL" x509 -req -CA "$ca/ca.pem" -CAkey "$ca/ca.key" -CAcreateserial -days 397 -sha256 -extfile "$ext" 2>/dev/null)
    { printf '%s\n' "$crt"; echo "#CA"; cat "$ca/ca.pem"; } | timeout 60 ssh "$tgt" "sudo -u $user sh -c 'd=\$HOME/.config/aphrody-cluster; awk \"/^#CA/{c=1;next} {print > (c ? \\\"\$d/ca.pem\\\" : \\\"\$d/client.crt\\\")}\"; cat \$d/client.crt \$d/client.key > \$d/client.pem; chmod 600 \$d/client.pem; echo client $user@$tgt ok'"
  fi
  rm -f "$ext"; exit 0
fi
m=$1; host=${2:-$m}; domain=cluster.internal
ca=${APHRODY_CLUSTER_CA:-$HOME/.local/share/aphrody/cluster-ca}
mkdir -p "$ca"; chmod 700 "$ca"
if [ ! -f "$ca/ca.key" ]; then
  MSYS_NO_PATHCONV=1 "$OPENSSL" req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 3650 \
    -keyout "$ca/ca.key" -out "$ca/ca.pem" -subj "/CN=aphrody cluster CA" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:0" -addext "keyUsage=critical,keyCertSign,cRLSign" 2>/dev/null
  chmod 600 "$ca/ca.key"
fi
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
timeout 60 ssh "$host" "sudo install -d -m 700 /etc/aphrody-cluster/tls && sudo sh -c 'test -f /etc/aphrody-cluster/tls/host.key || openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out /etc/aphrody-cluster/tls/host.key; chmod 600 /etc/aphrody-cluster/tls/host.key' && sudo openssl req -new -key /etc/aphrody-cluster/tls/host.key -subj /CN=$m.$domain" > "$tmp/host.csr"
printf 'subjectAltName=DNS:%s.%s,DNS:*.%s.%s\nextendedKeyUsage=serverAuth,clientAuth\nkeyUsage=critical,digitalSignature\nbasicConstraints=critical,CA:FALSE\n' "$m" "$domain" "$m" "$domain" > "$tmp/ext"
MSYS_NO_PATHCONV=1 "$OPENSSL" x509 -req -in "$tmp/host.csr" -CA "$ca/ca.pem" -CAkey "$ca/ca.key" -CAcreateserial -days 397 -sha256 -extfile "$tmp/ext" -out "$tmp/host.crt" 2>/dev/null
cat "$tmp/host.crt" "$ca/ca.pem" | timeout 60 ssh "$host" "sudo sh -c 'cat > /etc/aphrody-cluster/tls/bundle.tmp && csplit -s -z -f /etc/aphrody-cluster/tls/part /etc/aphrody-cluster/tls/bundle.tmp \"/-----BEGIN CERTIFICATE-----/\" \"{*}\" && mv /etc/aphrody-cluster/tls/part00 /etc/aphrody-cluster/tls/host.crt && mv /etc/aphrody-cluster/tls/part01 /etc/aphrody-cluster/tls/ca.pem && rm -f /etc/aphrody-cluster/tls/bundle.tmp && cat /etc/aphrody-cluster/tls/host.crt /etc/aphrody-cluster/tls/host.key > /etc/aphrody-cluster/tls/host.pem && chmod 600 /etc/aphrody-cluster/tls/host.pem && chmod 644 /etc/aphrody-cluster/tls/ca.pem /etc/aphrody-cluster/tls/host.crt && openssl x509 -in /etc/aphrody-cluster/tls/host.crt -noout -subject -enddate'"
