package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os/exec"
	"strings"
	"time"

	"sovereign.local/infra/internal/detect"
)

const DefaultVercelAPIBase = "https://api.vercel.com"

// VercelClient implements Vercel Deployment REST API v13 (`POST https://api.vercel.com/v13/deployments`)
// plus `vercel deploy --prebuilt` CLI execution.
type VercelClient struct {
	Token      string
	TeamID     string
	ProjectID  string
	BaseURL    string
	VercelBin  string
	HTTPClient *http.Client
}

// NewVercelClient builds a Vercel v13 client.
func NewVercelClient(token, teamID, projectID string) *VercelClient {
	return &VercelClient{
		Token:     token,
		TeamID:    teamID,
		ProjectID: projectID,
		BaseURL:   DefaultVercelAPIBase,
		VercelBin: "vercel",
		HTTPClient: &http.Client{
			Timeout: 25 * time.Second,
		},
	}
}

// String redacts the Vercel bearer token.
func (v *VercelClient) String() string {
	tok := "UNSET"
	if v.Token != "" {
		tok = fmt.Sprintf("SET [len=%d]", len(v.Token))
	}
	return fmt.Sprintf("VercelClient{TeamID:%q, ProjectID:%q, Token:%s}", v.TeamID, v.ProjectID, tok)
}

// VercelDeploymentFile represents an inline file uploaded to `/v13/deployments`.
type VercelDeploymentFile struct {
	File string `json:"file"`
	Data string `json:"data"`
}

// VercelDeploymentRequest models POST `/v13/deployments`.
type VercelDeploymentRequest struct {
	Name            string                 `json:"name"`
	Target          string                 `json:"target,omitempty"`
	Files           []VercelDeploymentFile `json:"files"`
	ProjectSettings map[string]any         `json:"projectSettings,omitempty"`
}

// VercelDeploymentResponse models the v13 deployment response.
type VercelDeploymentResponse struct {
	ID         string `json:"id"`
	URL        string `json:"url"`
	Name       string `json:"name"`
	ReadyState string `json:"readyState"`
}

// CreateDeployment invokes `POST https://api.vercel.com/v13/deployments`.
func (v *VercelClient) CreateDeployment(ctx context.Context, reqPayload VercelDeploymentRequest) (*VercelDeploymentResponse, error) {
	endpoint := strings.TrimRight(v.BaseURL, "/") + "/v13/deployments"
	if v.TeamID != "" {
		endpoint += "?teamId=" + url.QueryEscape(v.TeamID)
	}
	raw, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+v.Token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := v.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("vercel v13 deployments HTTP %d: %s", resp.StatusCode, string(body))
	}
	var out VercelDeploymentResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// DeployPrebuilt runs (or dry-runs) `vercel deploy --prebuilt --prod --yes`.
func (v *VercelClient) DeployPrebuilt(ctx context.Context, spec *detect.ProjectSpec, dryRun bool) (string, error) {
	args := []string{"deploy", "--prebuilt", "--prod", "--yes", "--cwd", spec.Path}
	if dryRun {
		return "[DRY-RUN] " + v.VercelBin + " " + strings.Join(args, " "), nil
	}
	if v.Token != "" {
		args = append(args, "--token", v.Token)
	}
	cmd := exec.CommandContext(ctx, v.VercelBin, args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("vercel prebuilt deploy failed: %w (%s)", err, strings.TrimSpace(string(out)))
	}
	return strings.TrimSpace(string(out)), nil
}
