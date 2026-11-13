// Package oci implements a daemonless OCI Image Layout v1.1 builder (inspired by google/go-containerregistry & ko)
// in 100% pure Go standard library, plus a lightweight Docker Engine HTTP API client supporting TCP, Unix sockets,
// and Windows Named Pipes (\\.\pipe\docker_engine).
package oci

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	OCILayoutVersion          = "1.0.0" // per OCI Image Layout v1.1 specification, imageLayoutVersion is "1.0.0"
	MediaTypeImageIndex       = "application/vnd.oci.image.index.v1+json"
	MediaTypeImageManifest    = "application/vnd.oci.image.manifest.v1+json"
	MediaTypeImageConfig      = "application/vnd.oci.image.config.v1+json"
	MediaTypeLayerTarGzip     = "application/vnd.oci.image.layer.v1.tar+gzip"
	AnnotationRefName         = "org.opencontainers.image.ref.name"
	AnnotationCreated         = "org.opencontainers.image.created"
	DeterministicEpochRFC3339 = "1970-01-01T00:00:00Z"
)

// Descriptor represents an OCI Content Descriptor.
type Descriptor struct {
	MediaType   string            `json:"mediaType"`
	Digest      string            `json:"digest"`
	Size        int64             `json:"size"`
	Annotations map[string]string `json:"annotations,omitempty"`
	Platform    *Platform         `json:"platform,omitempty"`
}

// Platform identifies the target OS and CPU architecture.
type Platform struct {
	Architecture string `json:"architecture"`
	OS           string `json:"os"`
}

// ImageLayoutFile represents the `oci-layout` JSON file.
type ImageLayoutFile struct {
	ImageLayoutVersion string `json:"imageLayoutVersion"`
}

// ImageIndex represents `index.json` in an OCI Image Layout.
type ImageIndex struct {
	SchemaVersion int               `json:"schemaVersion"`
	MediaType     string            `json:"mediaType"`
	Manifests     []Descriptor      `json:"manifests"`
	Annotations   map[string]string `json:"annotations,omitempty"`
}

// ImageManifest represents an OCI Image Manifest v1.
type ImageManifest struct {
	SchemaVersion int               `json:"schemaVersion"`
	MediaType     string            `json:"mediaType"`
	Config        Descriptor        `json:"config"`
	Layers        []Descriptor      `json:"layers"`
	Annotations   map[string]string `json:"annotations,omitempty"`
}

// ImageConfig represents an OCI Image Configuration JSON blob.
type ImageConfig struct {
	Created      string          `json:"created"`
	Architecture string          `json:"architecture"`
	OS           string          `json:"os"`
	Config       ContainerConfig `json:"config"`
	RootFS       RootFS          `json:"rootfs"`
	History      []HistoryEntry  `json:"history"`
}

// ContainerConfig configures runtime execution inside the container.
type ContainerConfig struct {
	User         string              `json:"User,omitempty"`
	ExposedPorts map[string]struct{} `json:"ExposedPorts,omitempty"`
	Env          []string            `json:"Env,omitempty"`
	Entrypoint   []string            `json:"Entrypoint,omitempty"`
	WorkingDir   string              `json:"WorkingDir,omitempty"`
	Labels       map[string]string   `json:"Labels,omitempty"`
}

// RootFS stores uncompressed tar layer DiffIDs.
type RootFS struct {
	Type    string   `json:"type"`
	DiffIDs []string `json:"diff_ids"`
}

// HistoryEntry records deterministic build provenance.
type HistoryEntry struct {
	Created   string `json:"created"`
	CreatedBy string `json:"created_by"`
}

// PackOptions configures PackBinaryLayout.
type PackOptions struct {
	BinaryPath   string
	BinaryName   string // optional override inside /app/<name>
	ImageRef     string // e.g. "ghcr.io/aphrody-labs/aphrody:latest"
	OutDir       string
	OS           string // defaults to "linux"
	Architecture string // defaults to "amd64"
	Port         int
	Env          []string
	ExtraFiles   map[string][]byte // container path -> raw bytes
}

// PackResult reports all deterministic digests written to OutDir.
type PackResult struct {
	OutDir         string `json:"outDir"`
	ImageRef       string `json:"imageRef"`
	IndexDigest    string `json:"indexDigest"`
	ManifestDigest string `json:"manifestDigest"`
	ConfigDigest   string `json:"configDigest"`
	LayerDigest    string `json:"layerDigest"`
	DiffID         string `json:"diffId"`
	LayerSize      int64  `json:"layerSize"`
}

// ComputeDigest returns "sha256:<64-hex>" for arbitrary bytes.
func ComputeDigest(data []byte) string {
	sum := sha256.Sum256(data)
	return "sha256:" + hex.EncodeToString(sum[:])
}

// PackBinaryLayout packages any binary (Linux ELF from Go/Rust/Bun or test payload) into a valid
// deterministic OCI Image Layout v1.1 directory without requiring a Docker daemon.
func PackBinaryLayout(opts PackOptions) (*PackResult, error) {
	if opts.BinaryPath == "" {
		return nil, fmt.Errorf("BinaryPath is required")
	}
	binBytes, err := os.ReadFile(opts.BinaryPath)
	if err != nil {
		return nil, fmt.Errorf("read binary %s: %w", opts.BinaryPath, err)
	}
	if opts.OutDir == "" {
		return nil, fmt.Errorf("OutDir is required")
	}
	targetOS := opts.OS
	if targetOS == "" {
		targetOS = "linux"
	}
	targetArch := opts.Architecture
	if targetArch == "" {
		targetArch = "amd64"
	}
	imageRef := opts.ImageRef
	if imageRef == "" {
		imageRef = "sovereign.local/app:latest"
	}
	binName := opts.BinaryName
	if binName == "" {
		binName = strings.TrimSuffix(filepath.Base(opts.BinaryPath), ".exe")
	}
	containerBinPath := "app/" + binName

	// 1. Build deterministic uncompressed tar stream + gzipped layer stream
	uncompressedTar, gzLayer, err := buildDeterministicLayer(containerBinPath, binBytes, opts.ExtraFiles)
	if err != nil {
		return nil, err
	}
	diffID := ComputeDigest(uncompressedTar)
	layerDigest := ComputeDigest(gzLayer)

	// 2. Build deterministic OCI Image Config JSON
	exposed := make(map[string]struct{})
	if opts.Port > 0 {
		exposed[fmt.Sprintf("%d/tcp", opts.Port)] = struct{}{}
	}
	env := []string{"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/app"}
	env = append(env, opts.Env...)

	cfgObj := ImageConfig{
		Created:      DeterministicEpochRFC3339,
		Architecture: targetArch,
		OS:           targetOS,
		Config: ContainerConfig{
			User:         "65532:65532",
			ExposedPorts: exposed,
			Env:          env,
			Entrypoint:   []string{"/" + containerBinPath},
			WorkingDir:   "/app",
			Labels: map[string]string{
				"org.opencontainers.image.RefName": imageRef,
				"sovereign.builder":                "src-deploy-go1.27-daemonless-oci",
			},
		},
		RootFS: RootFS{
			Type:    "layers",
			DiffIDs: []string{diffID},
		},
		History: []HistoryEntry{
			{
				Created:   DeterministicEpochRFC3339,
				CreatedBy: "src-deploy oci-pack (deterministic zero-daemon layer)",
			},
		},
	}
	cfgBytes, err := json.Marshal(cfgObj)
	if err != nil {
		return nil, err
	}
	cfgDigest := ComputeDigest(cfgBytes)

	// 3. Build OCI Image Manifest v1
	manifestObj := ImageManifest{
		SchemaVersion: 2,
		MediaType:     MediaTypeImageManifest,
		Config: Descriptor{
			MediaType: MediaTypeImageConfig,
			Digest:    cfgDigest,
			Size:      int64(len(cfgBytes)),
		},
		Layers: []Descriptor{
			{
				MediaType: MediaTypeLayerTarGzip,
				Digest:    layerDigest,
				Size:      int64(len(gzLayer)),
			},
		},
		Annotations: map[string]string{
			AnnotationRefName: imageRef,
			AnnotationCreated: DeterministicEpochRFC3339,
		},
	}
	manifestBytes, err := json.Marshal(manifestObj)
	if err != nil {
		return nil, err
	}
	manifestDigest := ComputeDigest(manifestBytes)

	// 4. Build OCI Image Index (`index.json`)
	indexObj := ImageIndex{
		SchemaVersion: 2,
		MediaType:     MediaTypeImageIndex,
		Manifests: []Descriptor{
			{
				MediaType: MediaTypeImageManifest,
				Digest:    manifestDigest,
				Size:      int64(len(manifestBytes)),
				Platform: &Platform{
					OS:           targetOS,
					Architecture: targetArch,
				},
				Annotations: map[string]string{
					AnnotationRefName: imageRef,
				},
			},
		},
	}
	indexBytes, err := json.MarshalIndent(indexObj, "", "  ")
	if err != nil {
		return nil, err
	}
	indexDigest := ComputeDigest(indexBytes)

	// 5. Write layout files to disk
	blobsDir := filepath.Join(opts.OutDir, "blobs", "sha256")
	if err := os.MkdirAll(blobsDir, 0o755); err != nil {
		return nil, err
	}
	layoutBytes, _ := json.Marshal(ImageLayoutFile{ImageLayoutVersion: OCILayoutVersion})
	if err := os.WriteFile(filepath.Join(opts.OutDir, "oci-layout"), layoutBytes, 0o644); err != nil {
		return nil, err
	}
	if err := os.WriteFile(filepath.Join(opts.OutDir, "index.json"), indexBytes, 0o644); err != nil {
		return nil, err
	}
	if err := writeBlob(blobsDir, layerDigest, gzLayer); err != nil {
		return nil, err
	}
	if err := writeBlob(blobsDir, cfgDigest, cfgBytes); err != nil {
		return nil, err
	}
	if err := writeBlob(blobsDir, manifestDigest, manifestBytes); err != nil {
		return nil, err
	}

	return &PackResult{
		OutDir:         filepath.ToSlash(opts.OutDir),
		ImageRef:       imageRef,
		IndexDigest:    indexDigest,
		ManifestDigest: manifestDigest,
		ConfigDigest:   cfgDigest,
		LayerDigest:    layerDigest,
		DiffID:         diffID,
		LayerSize:      int64(len(gzLayer)),
	}, nil
}

// ExportLayoutTarball bundles an OCI layout directory into a deterministic `.tar` archive suitable for `docker load` / `skopeo` / R2 upload.
func ExportLayoutTarball(layoutDir, outTarPath string) error {
	if err := os.MkdirAll(filepath.Dir(outTarPath), 0o755); err != nil {
		return err
	}
	f, err := os.Create(outTarPath)
	if err != nil {
		return err
	}
	defer f.Close()

	tw := tar.NewWriter(f)
	defer tw.Close()

	epoch := time.Unix(0, 0).UTC()
	return filepath.Walk(layoutDir, func(path string, info os.FileInfo, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(layoutDir, path)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		hdr := &tar.Header{
			Name:     filepath.ToSlash(rel),
			Mode:     0o644,
			Size:     int64(len(data)),
			ModTime:  epoch,
			Typeflag: tar.TypeReg,
			Format:   tar.FormatPAX,
		}
		if err := tw.WriteHeader(hdr); err != nil {
			return err
		}
		_, err = tw.Write(data)
		return err
	})
}

func writeBlob(blobsDir, digest string, data []byte) error {
	hexHash := strings.TrimPrefix(digest, "sha256:")
	return os.WriteFile(filepath.Join(blobsDir, hexHash), data, 0o644)
}

func buildDeterministicLayer(containerBinPath string, binBytes []byte, extra map[string][]byte) ([]byte, []byte, error) {
	var rawBuf bytes.Buffer
	tw := tar.NewWriter(&rawBuf)
	epoch := time.Unix(0, 0).UTC()

	// Create /app directory entry deterministically
	if err := tw.WriteHeader(&tar.Header{
		Name:     "app/",
		Mode:     0o755,
		ModTime:  epoch,
		Typeflag: tar.TypeDir,
		Format:   tar.FormatPAX,
	}); err != nil {
		return nil, nil, err
	}

	// Write executable binary
	if err := tw.WriteHeader(&tar.Header{
		Name:     strings.TrimPrefix(filepath.ToSlash(containerBinPath), "/"),
		Mode:     0o755,
		Size:     int64(len(binBytes)),
		ModTime:  epoch,
		Typeflag: tar.TypeReg,
		Format:   tar.FormatPAX,
	}); err != nil {
		return nil, nil, err
	}
	if _, err := tw.Write(binBytes); err != nil {
		return nil, nil, err
	}

	// Optional sorted extra files
	if len(extra) > 0 {
		keys := make([]string, 0, len(extra))
		for k := range extra {
			keys = append(keys, k)
		}
		// Simple insertion sort for determinism
		for i := 1; i < len(keys); i++ {
			for j := i; j > 0 && keys[j] < keys[j-1]; j-- {
				keys[j], keys[j-1] = keys[j-1], keys[j]
			}
		}
		for _, k := range keys {
			payload := extra[k]
			if err := tw.WriteHeader(&tar.Header{
				Name:     strings.TrimPrefix(filepath.ToSlash(k), "/"),
				Mode:     0o644,
				Size:     int64(len(payload)),
				ModTime:  epoch,
				Typeflag: tar.TypeReg,
				Format:   tar.FormatPAX,
			}); err != nil {
				return nil, nil, err
			}
			if _, err := tw.Write(payload); err != nil {
				return nil, nil, err
			}
		}
	}

	if err := tw.Close(); err != nil {
		return nil, nil, err
	}
	uncompressed := rawBuf.Bytes()

	var gzBuf bytes.Buffer
	gw, err := gzip.NewWriterLevel(&gzBuf, gzip.BestCompression)
	if err != nil {
		return nil, nil, err
	}
	gw.ModTime = epoch
	gw.Name = ""
	gw.Comment = ""
	gw.OS = 255 // unknown OS byte per deterministic gzip convention
	if _, err := gw.Write(uncompressed); err != nil {
		return nil, nil, err
	}
	if err := gw.Close(); err != nil {
		return nil, nil, err
	}
	return uncompressed, gzBuf.Bytes(), nil
}

// ============================================================================
// Docker Engine HTTP API Client (TCP / Unix Socket / Windows Named Pipe)
// ============================================================================

// DockerClient talks directly to Docker Engine API v1.45+.
type DockerClient struct {
	Endpoint   string
	HTTPClient *http.Client
	baseURL    string
}

// DockerVersion represents /version output from Docker Engine.
type DockerVersion struct {
	Version    string `json:"Version"`
	APIVersion string `json:"ApiVersion"`
	Os         string `json:"Os"`
	Arch       string `json:"Arch"`
}

// DockerContainerSummary represents a container entry from GET /containers/json.
type DockerContainerSummary struct {
	ID      string   `json:"Id"`
	Names   []string `json:"Names"`
	Image   string   `json:"Image"`
	State   string   `json:"State"`
	Status  string   `json:"Status"`
}

// NewDockerClient creates a Docker Engine HTTP client supporting `tcp://`, `http://`, `unix://`, and `npipe://`.
func NewDockerClient(endpoint string) *DockerClient {
	if endpoint == "" {
		endpoint = DefaultDockerEndpoint()
	}
	transport := &http.Transport{}
	baseURL := "http://docker"

	switch {
	case strings.HasPrefix(endpoint, "unix://"):
		sockPath := strings.TrimPrefix(endpoint, "unix://")
		transport.DialContext = func(ctx context.Context, _, _ string) (net.Conn, error) {
			var d net.Dialer
			return d.DialContext(ctx, "unix", sockPath)
		}
	case strings.HasPrefix(endpoint, "npipe://"):
		pipePath := strings.ReplaceAll(strings.TrimPrefix(endpoint, "npipe://"), "/", `\`)
		transport.DialContext = func(ctx context.Context, _, _ string) (net.Conn, error) {
			return dialDockerNamedPipe(ctx, pipePath)
		}
	case strings.HasPrefix(endpoint, "tcp://"):
		baseURL = "http://" + strings.TrimPrefix(endpoint, "tcp://")
	case strings.HasPrefix(endpoint, "http://") || strings.HasPrefix(endpoint, "https://"):
		baseURL = strings.TrimRight(endpoint, "/")
	}

	return &DockerClient{
		Endpoint: endpoint,
		baseURL:  baseURL,
		HTTPClient: &http.Client{
			Transport: transport,
			Timeout:   4 * time.Second,
		},
	}
}

// Ping checks whether the Docker daemon responds on `/_ping`.
func (c *DockerClient) Ping(ctx context.Context) (bool, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/_ping", nil)
	if err != nil {
		return false, err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return resp.StatusCode == http.StatusOK && strings.TrimSpace(string(body)) == "OK", nil
}

// Version queries GET `/version`.
func (c *DockerClient) Version(ctx context.Context) (*DockerVersion, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/version", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("docker version HTTP %d", resp.StatusCode)
	}
	var v DockerVersion
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return nil, err
	}
	return &v, nil
}

// ListContainers queries GET `/containers/json?all=true`.
func (c *DockerClient) ListContainers(ctx context.Context, all bool) ([]DockerContainerSummary, error) {
	q := "false"
	if all {
		q = "true"
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/containers/json?all="+q, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("docker containers HTTP %d", resp.StatusCode)
	}
	var list []DockerContainerSummary
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}
