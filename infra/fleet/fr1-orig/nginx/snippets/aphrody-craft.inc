location ^~ /craft/ { alias /home/ubuntu/apps/craft-web/current/; index
index.html; default_type text/html; add_header Cross-Origin-Opener-Policy
same-origin always; add_header Cross-Origin-Embedder-Policy credentialless
always; types { application/wasm wasm; application/javascript js; text/html
html; text/css css; image/svg+xml svg; image/png png; } }
