package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const DefaultOllamaBaseURL = "http://127.0.0.1:11434"

// CanonicalSovereignModels lists the open-weights coding and reasoning models synchronized across the fleet.
var CanonicalSovereignModels = []string{
	"qwen3-coder",
	"deepseek-r1",
	"gemma4",
}

// OllamaClient speaks the native Ollama REST protocol (`/api/tags`, `/api/pull`, `/api/ps`, `/api/generate`).
type OllamaClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewOllamaClient creates an Ollama REST API client.
func NewOllamaClient(baseURL string) *OllamaClient {
	if baseURL == "" {
		baseURL = DefaultOllamaBaseURL
	}
	return &OllamaClient{
		BaseURL: strings.TrimRight(baseURL, "/"),
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// OllamaModelTag represents an installed model entry from GET `/api/tags`.
type OllamaModelTag struct {
	Name       string `json:"name"`
	Digest     string `json:"digest"`
	Size       int64  `json:"size"`
	ModifiedAt string `json:"modified_at"`
}

// OllamaRunningModel represents an active VRAM/RAM loaded model from GET `/api/ps`.
type OllamaRunningModel struct {
	Name      string `json:"name"`
	Model     string `json:"model"`
	Size      int64  `json:"size"`
	SizeVRAM  int64  `json:"size_vram"`
	ExpiresAt string `json:"expires_at"`
}

// OllamaPullStatus represents the response from POST `/api/pull` (with `stream: false`).
type OllamaPullStatus struct {
	Status string `json:"status"`
}

// OllamaGenerateRequest represents POST `/api/generate`.
type OllamaGenerateRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

// OllamaGenerateResponse represents the non-streaming response from POST `/api/generate`.
type OllamaGenerateResponse struct {
	Model    string `json:"model"`
	Response string `json:"response"`
	Done     bool   `json:"done"`
}

// ListTags queries GET `/api/tags`.
func (o *OllamaClient) ListTags(ctx context.Context) ([]OllamaModelTag, error) {
	var env struct {
		Models []OllamaModelTag `json:"models"`
	}
	if err := o.doJSON(ctx, http.MethodGet, "/api/tags", nil, &env); err != nil {
		return nil, err
	}
	return env.Models, nil
}

// ListRunning queries GET `/api/ps`.
func (o *OllamaClient) ListRunning(ctx context.Context) ([]OllamaRunningModel, error) {
	var env struct {
		Models []OllamaRunningModel `json:"models"`
	}
	if err := o.doJSON(ctx, http.MethodGet, "/api/ps", nil, &env); err != nil {
		return nil, err
	}
	return env.Models, nil
}

// PullModel triggers non-streaming model synchronization via POST `/api/pull`.
func (o *OllamaClient) PullModel(ctx context.Context, model string) (*OllamaPullStatus, error) {
	req := map[string]any{
		"model":  model,
		"stream": false,
	}
	var out OllamaPullStatus
	if err := o.doJSON(ctx, http.MethodPost, "/api/pull", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// Generate runs a single non-streaming inference call via POST `/api/generate`.
func (o *OllamaClient) Generate(ctx context.Context, model, prompt string) (*OllamaGenerateResponse, error) {
	req := OllamaGenerateRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}
	var out OllamaGenerateResponse
	if err := o.doJSON(ctx, http.MethodPost, "/api/generate", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// SyncFleetModels ensures all CanonicalSovereignModels (`qwen3-coder`, `deepseek-r1`, `gemma4`) are present on a node.
func (o *OllamaClient) SyncFleetModels(ctx context.Context, models []string, dryRun bool) ([]string, error) {
	if len(models) == 0 {
		models = CanonicalSovereignModels
	}
	if dryRun {
		plan := make([]string, 0, len(models))
		for _, m := range models {
			plan = append(plan, fmt.Sprintf("[DRY-RUN] POST %s/api/pull model=%s", o.BaseURL, m))
		}
		return plan, nil
	}
	tags, err := o.ListTags(ctx)
	if err != nil {
		return nil, err
	}
	installed := make(map[string]bool, len(tags))
	for _, t := range tags {
		installed[t.Name] = true
		installed[strings.Split(t.Name, ":")[0]] = true
	}
	var synced []string
	for _, m := range models {
		if installed[m] {
			synced = append(synced, fmt.Sprintf("present:%s", m))
			continue
		}
		st, err := o.PullModel(ctx, m)
		if err != nil {
			return synced, err
		}
		synced = append(synced, fmt.Sprintf("pulled:%s (%s)", m, st.Status))
	}
	return synced, nil
}

func (o *OllamaClient) doJSON(ctx context.Context, method, path string, in any, out any) error {
	var body io.Reader
	if in != nil {
		b, err := json.Marshal(in)
		if err != nil {
			return err
		}
		body = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, o.BaseURL+path, body)
	if err != nil {
		return err
	}
	if in != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := o.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ollama %s %s HTTP %d: %s", method, path, resp.StatusCode, string(raw))
	}
	if out != nil && len(raw) > 0 {
		return json.Unmarshal(raw, out)
	}
	return nil
}
