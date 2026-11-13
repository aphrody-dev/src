# Origin reserved to the fleet, the mesh and loopback ($fleet_peer, snippets/fleet-peers.geo via conf.d/aop.conf).
# The public is served by Workers for these names; Cloudflare ranges get 403 too, so a third-party Cloudflare zone
# pointed at 51.255.162.6 cannot reach these vhosts.
if ($fleet_peer = 0) { return 403; }
