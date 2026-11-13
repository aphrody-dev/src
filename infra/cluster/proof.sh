#!/usr/bin/env bash
# just cluster-proof: member health, mesh reachability matrix + benchmark vs WireGuard, kill-test (failover and
# restore timings), cache coalescing and idempotency. Read-only except the kill-test, which stops one stateless
# replica on fr1/fr2 (never prd) and restarts it. Output: JSON lines on stdout (docs/infra/CLUSTER.md).
set -uo pipefail
members=(fr1 fr2 prd)
declare -A ip=([fr1]=51.77.147.152 [fr2]=51.255.162.6 [prd]=72.60.186.43)
declare -A wg=([fr1]=10.200.77.1 [fr2]=10.200.77.3 [prd]=10.200.77.5)
D=cluster.internal; P=7444; T=/etc/aphrody-cluster/tls
on() { local h=$1; shift; timeout "${TMO:-90}" ssh -o ConnectTimeout=10 "$h" "sudo bash -c $(printf '%q' "$*")"; }
stat_cmd='echo "show stat" | (command -v socat >/dev/null && socat - UNIX:/run/aphrody-cluster/haproxy.sock || python3 -c "import socket,sys;s=socket.socket(socket.AF_UNIX);s.connect(\"/run/aphrody-cluster/haproxy.sock\");s.sendall(b\"show stat\n\");b=b\"\"
while (d:=s.recv(65536)): b+=d
sys.stdout.write(b.decode())")'

echo "## health"
for m in "${members[@]}"; do
  on "$m" "$stat_cmd" | awk -F, -v m="$m" '$1 ~ /^pool_/ && $2 != "BACKEND" {printf "{\"entry\":\"%s\",\"pool\":\"%s\",\"member\":\"%s\",\"status\":\"%s\",\"check\":\"%s\"}\n", m, substr($1,6), $2, $18, $37}'
done

echo "## mesh matrix (mTLS TCP $P) vs WireGuard"
for a in "${members[@]}"; do for b in "${members[@]}"; do
  [ "$a" = "$b" ] && continue
  on "$a" "
    m=\$(curl -s -o /dev/null -w '%{http_code} %{time_connect} %{time_appconnect} %{time_total}' --cert $T/host.pem --cacert $T/ca.pem --resolve bench.$b.$D:$P:${ip[$b]} https://bench.$b.$D:$P/bench/1k -m 10)
    mt=\$(curl -s -o /dev/null -w '%{speed_download}' --cert $T/host.pem --cacert $T/ca.pem --resolve bench.$b.$D:$P:${ip[$b]} https://bench.$b.$D:$P/bench/64m -m 120)
    w=\$(curl -s -o /dev/null -w '%{http_code} %{time_connect} %{time_total}' http://${wg[$b]}:29990/bench/1k -m 10)
    wt=\$(curl -s -o /dev/null -w '%{speed_download}' http://${wg[$b]}:29990/bench/64m -m 120)
    echo \"{\\\"from\\\":\\\"$a\\\",\\\"to\\\":\\\"$b\\\",\\\"mesh\\\":\\\"\$m\\\",\\\"mesh_Bps\\\":\${mt:-0},\\\"wg\\\":\\\"\$w\\\",\\\"wg_Bps\\\":\${wt:-0}}\"
  "
done; done

echo "## kill-test (cdn replica)"
victim=${VICTIM:-fr2}; entry=${ENTRY:-prd}
uri=""
for i in $(seq 1 60); do
  s=$(on "$entry" "curl -s -o /dev/null -D - 'http://127.0.0.1:19796/?k=$i' -m 5 | tr -d '\r' | awk 'tolower(\$1)==\"x-cluster-shard:\"{print \$2}'")
  [ "$s" = "$victim" ] && { uri="/?k=$i"; break; }
done
echo "{\"victim\":\"$victim\",\"entry\":\"$entry\",\"uri\":\"$uri\"}"
TMO=120 on "$entry" "rm -f /tmp/acl-kill.log; end=\$((SECONDS+40)); n=0; err=0
  while [ \$SECONDS -lt \$end ]; do
    r=\$(curl -s -o /dev/null -D - 'http://127.0.0.1:19796$uri' -m 5 | tr -d '\r' | awk 'NR==1{c=\$2} tolower(\$1)==\"x-cluster-shard:\"{s=\$2} END{print c\" \"s}')
    n=\$((n+1)); case \"\$r\" in 2*|3*|404*) ;; *) err=\$((err+1));; esac
    echo \"\$(date +%s.%N | cut -c1-14) \$r\" >> /tmp/acl-kill.log; sleep 0.1
  done; echo \"{\\\"requests\\\":\$n,\\\"client_errors\\\":\$err}\"" &
loop=$!
sleep 6
t0=$(on "$victim" "date +%s.%N | cut -c1-14; docker stop -t 2 aphrody-src-cdn-1 >/dev/null")
sleep 15
t1=$(on "$victim" "date +%s.%N | cut -c1-14; docker start aphrody-src-cdn-1 >/dev/null")
wait $loop
on "$entry" "awk -v t0=$t0 -v t1=$t1 -v v=$victim '
  \$1>t0 && \$3!=v && !away {away=\$1} \$1>t1 && \$3==v && !back {back=\$1}
  END {printf \"{\\\"stop_to_rerouted_s\\\":%.2f,\\\"start_to_back_s\\\":%.2f}\\n\", away-t0, back-t1}' /tmp/acl-kill.log"

echo "## coalescing (90 concurrent identical GETs, 30 per member; origin fetches expected: 1)"
key="/coalesce-$(date +%s%N)"
for m in "${members[@]}"; do on "$m" "for i in \$(seq 30); do curl -s -o /dev/null 'http://127.0.0.1:19796$key' -m 20 & done; wait" & done; wait
for m in "${members[@]}"; do
  on "$m" "awk -v k='$key' '\$5==k {print \$7}' /var/log/nginx/aphrody-cluster.log | sort | uniq -c | tr -s ' ' | tr '\n' ' '" | sed "s/^/{\"shard\":\"$m\",\"cache_status_counts\":\"/;s/$/\"}/"; echo
done

echo "## idempotency (10 concurrent POSTs, same Idempotency-Key)"
ik="proof-$(date +%s%N)"
on prd "for i in \$(seq 10); do curl -s -o /dev/null -w '%{http_code} ' -X POST -H 'Idempotency-Key: $ik' --data x 'http://127.0.0.1:19081/idem-proof' -m 20 & done; wait; echo"
for m in "${members[@]}"; do
  on "$m" "tail -n 50 /var/log/nginx/aphrody-cluster.log | awk '\$3==\"POST\" && \$5==\"/idem-proof\" {print \$7}' | sort | uniq -c | tr '\n' ' '" | sed "s/^/{\"shard\":\"$m\",\"idem_cache_status\":\"/;s/$/\"}/"; echo
done

echo "## dedup ratio"
for m in "${members[@]}"; do on "$m" "cat /var/log/nginx/aphrody-cluster.log" | bun "$(dirname "$0")/dedup.ts" cluster | sed "s/^{/{\"member\":\"$m\",/"; done

echo "## ssh over the mesh (<member>-mesh, independent of WireGuard)"
declare -A su=([fr1]=ubuntu [fr2]=ubuntu [prd]=root)
for a in "${members[@]}"; do for b in "${members[@]}"; do
  [ "$a" = "$b" ] && continue
  r=$(timeout 40 ssh -o ConnectTimeout=10 "$a" "s=\$(date +%s%N); ssh -o BatchMode=yes ${su[$b]}@$b-mesh true 2>/dev/null; e=\$?; echo \$e \$(( (\$(date +%s%N)-s)/1000000 ))")
  echo "{\"from\":\"$a\",\"to\":\"$b\",\"exit\":${r% *},\"ms\":${r#* }}"
done; done
