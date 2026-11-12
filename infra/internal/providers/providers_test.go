package providers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"sovereign.local/infra/internal/detect"
)

func TestR2S3v4SigningAndPutObject(t *testing.T) {
	urlStr := "https://ca22c1a51a145f919b54afa18d936516.r2.cloudflarestorage.com/shenron-cdn/releases/v1.tar"
	payloadHash := sha256Hex([]byte("oci-payload"))
	auth, err := SignS3v4AuthHeader(
		"PUT",
		urlStr,
		"AKIAIOSFODNN7EXAMPLE",
		"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
		"auto",
		payloadHash,
		"20261110T220000Z",
	)
	if err != nil {
		t.Fatalf("SignS3v4AuthHeader error: %v", err)
	}
	if !strings.HasPrefix(auth, "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20261110/auto/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=") {
		t.Fatalf("unexpected auth header: %s", auth)
	}

	// Mock R2 server
	var gotAuth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		w.Header().Set("ETag", `"etag-123"`)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	r2 := NewR2Client("ca22c1a51a145f919b54afa18d936516", "AKIA_TEST", "SECRET_TEST")
	r2.Endpoint = srv.URL

	if err := r2.HeadBucket(context.Background(), "shenron-cdn"); err != nil {
		t.Fatalf("HeadBucket failed: %v", err)
	}
	etag, err := r2.PutObject(context.Background(), "shenron-cdn", "artifact.tar", []byte("hello"), "application/x-tar")
	if err != nil || etag != `"etag-123"` {
		t.Fatalf("PutObject failed: etag=%s err=%v", etag, err)
	}
	if !strings.HasPrefix(gotAuth, "AWS4-HMAC-SHA256 ") {
		t.Fatalf("expected signed Authorization header on mock server, got %q", gotAuth)
	}

	presigned, err := r2.PresignGetURL("shenron-cdn", "artifact.tar", 900, time.Date(2026, 11, 10, 22, 0, 0, 0, time.UTC))
	if err != nil || !strings.Contains(presigned, "X-Amz-Signature=") {
		t.Fatalf("PresignGetURL failed: %s err=%v", presigned, err)
	}
}

func TestUSAGoogleEgressPolicyEnforcement(t *testing.T) {
	euApp := &detect.ProjectSpec{
		Name:         "aphrody",
		Region:       detect.RegionEUFrance,
		GoogleEgress: false,
		TargetNodes:  []string{"usa"}, // forbidden!
	}
	if err := ValidateProjectPlacement(euApp); err == nil {
		t.Fatalf("expected policy rejection when non-Google workload targets 'usa'")
	}

	googleProxy := &detect.ProjectSpec{
		Name:         "ai-triad",
		Region:       detect.RegionUSGoogleEgress,
		GoogleEgress: true,
		TargetNodes:  []string{"usa"},
		Port:         4200,
		BluePort:     14200,
		GreenPort:    24200,
	}
	if err := ValidateProjectPlacement(googleProxy); err != nil {
		t.Fatalf("expected Google egress workload to be allowed on 'usa', got: %v", err)
	}
	steps, err := PlanBlueGreenRollout(googleProxy, "dist/ai-triad", "blue")
	if err != nil || len(steps) != 3 {
		t.Fatalf("PlanBlueGreenRollout failed: steps=%d err=%v", len(steps), err)
	}
}

func TestCaddyfileAndSystemdGeneration(t *testing.T) {
	specs := []*detect.ProjectSpec{
		{
			Name:        "aphrody",
			Runtime:     detect.RuntimeBunFullstack,
			Region:      detect.RegionEUFrance,
			TargetNodes: []string{"fr1", "fr2"},
			Domains:     []string{"aphrody.com", "www.aphrody.com"},
			Port:        3000,
			BluePort:    13000,
			GreenPort:   23000,
		},
	}
	cf := GenerateCaddyfile(specs)
	if !strings.Contains(cf, "protocols h1 h2 h3") || !strings.Contains(cf, "aphrody.com, www.aphrody.com") || !strings.Contains(cf, "10.200.77.5:9443") {
		t.Fatalf("Caddyfile missing expected HTTP/3 or Google egress guard:\n%s", cf)
	}
	unit := GenerateSystemdUnit(specs[0], "1G")
	if !strings.Contains(unit, "DynamicUser=yes") || !strings.Contains(unit, "MemoryMax=1G") || !strings.Contains(unit, "Restart=always") {
		t.Fatalf("systemd unit missing hardening directives:\n%s", unit)
	}
}

func TestOVHSignatureAndMockAPI(t *testing.T) {
	sig := ComputeOVHSignature("my_secret", "my_ck", "GET", "https://eu.api.ovh.com/1.0/vps", "", 1700000000)
	if !strings.HasPrefix(sig, "$1$") || len(sig) != 43 {
		t.Fatalf("invalid OVH signature format: %s", sig)
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.Header.Get("X-Ovh-Signature"), "$1$") {
			http.Error(w, "missing signature", http.StatusUnauthorized)
			return
		}
		_ = json.NewEncoder(w).Encode([]string{"vps-fr1.ovh.net", "vps-fr2.ovh.net"})
	}))
	defer srv.Close()

	client := NewOVHClient("ak", "as", "ck", "")
	client.Endpoint = srv.URL
	vps, err := client.ListVPS(context.Background())
	if err != nil || len(vps) != 2 {
		t.Fatalf("ListVPS failed: %+v err=%v", vps, err)
	}
}

func TestCloudflareVercelGCloudAndOllamaAdapters(t *testing.T) {
	// Cloudflare DNS + Workers + Tunnel mock
	cfSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/dns_records"):
			_, _ = w.Write([]byte(`{"success":true,"result":[]}`))
		case r.Method == http.MethodPost && strings.Contains(r.URL.Path, "/dns_records"):
			_, _ = w.Write([]byte(`{"success":true,"result":{"id":"rec1","type":"A","name":"aphrody.com","content":"51.77.147.152","proxied":true}}`))
		case r.Method == http.MethodPut && strings.Contains(r.URL.Path, "/workers/scripts/"):
			_, _ = w.Write([]byte(`{"success":true}`))
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/cfd_tunnel"):
			_, _ = w.Write([]byte(`{"success":true,"result":[{"id":"tun1","name":"fr1-mesh","status":"healthy"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer cfSrv.Close()

	cf := NewCloudflareClient("tok", DefaultCloudflareAccountID)
	cf.BaseURL = cfSrv.URL
	rec, err := cf.UpsertDNSRecord(context.Background(), "zone123", DNSRecord{Type: "A", Name: "aphrody.com", Content: "51.77.147.152", Proxied: true})
	if err != nil || rec.ID != "rec1" {
		t.Fatalf("UpsertDNSRecord failed: %+v err=%v", rec, err)
	}
	if err := cf.DeployWorkerScript(context.Background(), "shenron-cdn", []byte("export default {}"), "2026-10-11"); err != nil {
		t.Fatalf("DeployWorkerScript failed: %v", err)
	}
	tun, err := cf.EnsureZeroTrustTunnel(context.Background(), "fr1-mesh")
	if err != nil || tun.ID != "tun1" {
		t.Fatalf("EnsureZeroTrustTunnel failed: %+v err=%v", tun, err)
	}

	// Vercel v13 mock
	vSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(VercelDeploymentResponse{ID: "dpl_1", URL: "aphrody.vercel.app", ReadyState: "READY"})
	}))
	defer vSrv.Close()
	vc := NewVercelClient("vtok", "team_1", "prj_1")
	vc.BaseURL = vSrv.URL
	dpl, err := vc.CreateDeployment(context.Background(), VercelDeploymentRequest{Name: "aphrody"})
	if err != nil || dpl.ID != "dpl_1" {
		t.Fatalf("Vercel CreateDeployment failed: %+v err=%v", dpl, err)
	}

	// GCloud plan check
	gc := NewGCloudDeployer("aphrody", "europe-west1")
	plan := gc.Plan(&detect.ProjectSpec{Name: "aphrody", Region: detect.RegionEUFrance, Port: 3000}, "v1")
	if !strings.Contains(plan.ImageURI, "europe-west1-docker.pkg.dev/aphrody/") {
		t.Fatalf("unexpected Cloud Run image URI: %s", plan.ImageURI)
	}

	// Ollama mock
	olSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/tags":
			_, _ = w.Write([]byte(`{"models":[{"name":"qwen3-coder:latest","size":1234}]}`))
		case "/api/pull":
			_, _ = w.Write([]byte(`{"status":"success"}`))
		case "/api/ps":
			_, _ = w.Write([]byte(`{"models":[{"name":"qwen3-coder:latest","size_vram":8192}]}`))
		case "/api/generate":
			_, _ = w.Write([]byte(`{"model":"qwen3-coder","response":"package main","done":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer olSrv.Close()

	ol := NewOllamaClient(olSrv.URL)
	synced, err := ol.SyncFleetModels(context.Background(), nil, false)
	if err != nil || len(synced) != 3 {
		t.Fatalf("SyncFleetModels failed: %+v err=%v", synced, err)
	}
	gen, err := ol.Generate(context.Background(), "qwen3-coder", "hello")
	if err != nil || !gen.Done {
		t.Fatalf("Ollama Generate failed: %+v err=%v", gen, err)
	}
}
