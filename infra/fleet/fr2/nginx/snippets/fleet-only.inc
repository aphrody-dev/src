# Origin reserved to the fleet (fleet-health --resolve checks, self-host fallback), the mesh and loopback.
# Public traffic for these names is served by Workers; Cloudflare ranges are refused here, so a third-party
# Cloudflare zone pointed at 51.255.162.6 gets 403 (closes the "any CF zone" gap of fr2-edge-fw for these vhosts).
allow 127.0.0.0/8;
allow ::1;
allow 10.200.77.0/24;
allow 51.77.147.152;
allow 72.60.186.43;
allow 51.255.162.6;
allow 2001:41d0:404:200::4d8e;
allow 2a02:4780:28:8e1e::1;
allow 2001:41d0:305:2100::a461;
deny all;
