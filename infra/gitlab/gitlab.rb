# Sovereign GitLab CE Omnibus Configuration (OVH FR2 Lean Footprint)
# Host: https://git.aphrody.com | Registry: https://registry.aphrody.com
# Organization Admin: contact@aphrody.com | SMTP: mail.aphrody.com (Stalwart)

external_url "https://git.aphrody.com"
gitlab_rails["initial_root_email"] = "contact@aphrody.com"
gitlab_rails["gitlab_email_from"] = "contact@aphrody.com"
gitlab_rails["gitlab_email_display_name"] = "Aphrody Sovereign GitLab"
gitlab_rails["gitlab_email_reply_to"] = "contact@aphrody.com"
gitlab_rails["time_zone"] = "Europe/Paris"

# Reverse proxy termination via Cloudflare Tunnel / Caddy on OVH FR2 (:8929)
nginx["listen_port"] = 8929
nginx["listen_https"] = false
nginx["proxy_set_headers"] = {
  "X-Forwarded-Proto" => "https",
  "X-Forwarded-Ssl" => "on"
}

# Dedicated SSH port (:2224) avoiding host OpenSSH (:22) collision
gitlab_rails["gitlab_shell_ssh_port"] = 2224

# Memory-Tuned Puma & Sidekiq for lean OVH FR2 VPS footprint (< 3.2 GB RSS)
puma["worker_processes"] = 2
puma["min_threads"] = 1
puma["max_threads"] = 4
puma["per_worker_max_memory_mb"] = 1024

sidekiq["concurrency"] = 8

postgresql["shared_buffers"] = "256MB"
postgresql["max_worker_processes"] = 4

gitaly["configuration"] = {
  concurrency: [
    {
      rpc: "/gitaly.SmartHTTPService/PostUploadPackWithSidechannel",
      max_per_repo: 8
    },
    {
      rpc: "/gitaly.SSHService/SSHUploadPackWithSidechannel",
      max_per_repo: 8
    }
  ]
}

# Disable Prometheus / Grafana monitoring bundle for lean OVH FR2 footprint
prometheus_monitoring["enable"] = false
prometheus["enable"] = false
alertmanager["enable"] = false
node_exporter["enable"] = false
redis_exporter["enable"] = false
postgres_exporter["enable"] = false
gitlab_exporter["enable"] = false

# Sovereign Container Registry (registry.aphrody.com -> 127.0.0.1:5050)
registry_external_url "https://registry.aphrody.com"
gitlab_rails["registry_enabled"] = true
registry_nginx["listen_port"] = 5050
registry_nginx["listen_https"] = false
registry_nginx["proxy_set_headers"] = {
  "X-Forwarded-Proto" => "https",
  "X-Forwarded-Ssl" => "on"
}

# Package Registry (Generic / Pacman .pkg.tar.zst / WSL2 rootfs tarballs / Cargo / npm)
gitlab_rails["packages_enabled"] = true
gitlab_rails["dependency_proxy_enabled"] = true
gitlab_rails["lfs_enabled"] = true

# Sovereign Stalwart Mail Integration (mail.aphrody.com)
gitlab_rails["smtp_enable"] = true
gitlab_rails["smtp_address"] = "mail.aphrody.com"
gitlab_rails["smtp_port"] = 587
gitlab_rails["smtp_user_name"] = "contact@aphrody.com"
gitlab_rails["smtp_password"] = ENV["STALWART_SMTP_PASSWORD"]
gitlab_rails["smtp_domain"] = "aphrody.com"
gitlab_rails["smtp_authentication"] = "login"
gitlab_rails["smtp_enable_starttls_auto"] = true
gitlab_rails["smtp_tls"] = false
gitlab_rails["smtp_openssl_verify_mode"] = "peer"

# Default repository protections & Tri-Forge mirroring readiness
gitlab_rails["gitlab_default_projects_features_issues"] = true
gitlab_rails["gitlab_default_projects_features_merge_requests"] = true
gitlab_rails["gitlab_default_projects_features_builds"] = true
gitlab_rails["gitlab_default_projects_features_container_registry"] = true
gitlab_rails["gitlab_default_projects_features_snippets"] = false
gitlab_rails["gitlab_default_projects_features_wiki"] = false
