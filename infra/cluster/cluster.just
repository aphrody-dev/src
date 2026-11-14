# Cluster layer (docs/infra/CLUSTER.md): LB + failover + dedup across fr1/fr2/prd, generated from infra/deploy.toml.

# Regenerate infra/cluster/generated/* from infra/deploy.toml [cluster]
[group('cluster')]
cluster-gen:
    bun "{{root}}/infra/cluster/gen.ts"

# Push + validate + reload one member (rollback: just cluster-down <member>)
[group('cluster')]
cluster-deploy member: cluster-gen
    bash "{{root}}/infra/cluster/deploy.sh" {{member}}

# Stop the cluster data plane on one member (HAProxy off, nginx shard conf removed)
[group('cluster')]
cluster-down member:
    bash "{{root}}/infra/cluster/deploy.sh" {{member}} down

# Issue/renew a member certificate (CA key stays in ~/.local/share/aphrody/cluster-ca)
[group('cluster')]
cluster-pki member:
    bash "{{root}}/infra/cluster/pki.sh" {{member}}

# Health, mesh matrix vs WireGuard, kill-test, coalescing, idempotency, dedup ratio
[group('cluster')]
cluster-proof:
    bash "{{root}}/infra/cluster/proof.sh"
