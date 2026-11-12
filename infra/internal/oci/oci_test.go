package oci

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestPackBinaryLayoutDeterministic(t *testing.T) {
	tmp := t.TempDir()
	binFile := filepath.Join(tmp, "sample-linux-amd64")
	if err := os.WriteFile(binFile, []byte{0x7f, 'E', 'L', 'F', 0x02, 0x01, 0x01, 0x00}, 0o755); err != nil {
		t.Fatal(err)
	}

	out1 := filepath.Join(tmp, "oci1")
	out2 := filepath.Join(tmp, "oci2")

	res1, err := PackBinaryLayout(PackOptions{
		BinaryPath: binFile,
		ImageRef:   "sovereign.local/sample:v1",
		OutDir:     out1,
		Port:       3000,
	})
	if err != nil {
		t.Fatalf("PackBinaryLayout 1 failed: %v", err)
	}

	res2, err := PackBinaryLayout(PackOptions{
		BinaryPath: binFile,
		ImageRef:   "sovereign.local/sample:v1",
		OutDir:     out2,
		Port:       3000,
	})
	if err != nil {
		t.Fatalf("PackBinaryLayout 2 failed: %v", err)
	}

	if res1.ManifestDigest != res2.ManifestDigest || res1.LayerDigest != res2.LayerDigest || res1.ConfigDigest != res2.ConfigDigest {
		t.Fatalf("expected byte-for-byte deterministic digests, got %+v vs %+v", res1, res2)
	}

	// Verify oci-layout and index.json exist and parse cleanly
	rawLayout, err := os.ReadFile(filepath.Join(out1, "oci-layout"))
	if err != nil {
		t.Fatal(err)
	}
	var lf ImageLayoutFile
	if err := json.Unmarshal(rawLayout, &lf); err != nil || lf.ImageLayoutVersion != "1.0.0" {
		t.Fatalf("invalid oci-layout: %s", string(rawLayout))
	}

	rawIndex, err := os.ReadFile(filepath.Join(out1, "index.json"))
	if err != nil {
		t.Fatal(err)
	}
	var idx ImageIndex
	if err := json.Unmarshal(rawIndex, &idx); err != nil || len(idx.Manifests) != 1 {
		t.Fatalf("invalid index.json: %v", err)
	}

	// Verify tarball export
	tarPath := filepath.Join(tmp, "sample.oci.tar")
	if err := ExportLayoutTarball(out1, tarPath); err != nil {
		t.Fatalf("ExportLayoutTarball failed: %v", err)
	}
	st, err := os.Stat(tarPath)
	if err != nil || st.Size() == 0 {
		t.Fatalf("expected non-empty tar archive")
	}
}

func TestDockerClientHTTPMock(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/_ping":
			_, _ = w.Write([]byte("OK"))
		case r.URL.Path == "/version":
			_ = json.NewEncoder(w).Encode(DockerVersion{Version: "27.5.1", APIVersion: "1.47", Os: "linux", Arch: "amd64"})
		case strings.HasPrefix(r.URL.Path, "/containers/json"):
			_ = json.NewEncoder(w).Encode([]DockerContainerSummary{
				{ID: "abc123", Names: []string{"/aphrody-blue"}, Image: "sovereign/aphrody:latest", State: "running"},
			})
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	client := NewDockerClient(srv.URL)
	ctx := context.Background()

	ok, err := client.Ping(ctx)
	if err != nil || !ok {
		t.Fatalf("Ping failed: ok=%v err=%v", ok, err)
	}
	ver, err := client.Version(ctx)
	if err != nil || ver.Version != "27.5.1" {
		t.Fatalf("Version failed: %+v err=%v", ver, err)
	}
	containers, err := client.ListContainers(ctx, true)
	if err != nil || len(containers) != 1 || containers[0].Image != "sovereign/aphrody:latest" {
		t.Fatalf("ListContainers failed: %+v err=%v", containers, err)
	}
}
