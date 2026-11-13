# Single source of the fleet peers trusted by fr2 nginx (geo $fleet_peer in conf.d/aop.conf): loopback, mesh, and the
# public v4/v6 of fr1, prd and fr2 itself (fleet-health from fr2, local checks). Same hosts as deploy.toml [nodes.*] and
# fr2-edge-fw.sh fleet4/fleet6; update the three together.
127.0.0.0/8 1;
::1 1;
10.200.77.0/24 1;
51.77.147.152 1;
72.60.186.43 1;
51.255.162.6 1;
2001:41d0:404:200::4d8e 1;
2a02:4780:28:8e1e::1 1;
2001:41d0:305:2100::a461 1;
