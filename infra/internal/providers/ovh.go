package providers

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

const DefaultOVHEUEndpoint = "https://eu.api.ovh.com/1.0"

// OVHClient implements official OVHcloud API v1.0 `$1$<sha1(...)>` request signing
// plus wrapper commands around `ovhcloud.exe` for `fr1` & `fr2` VPS health, firewall, and snapshots.
type OVHClient struct {
	Endpoint          string
	ApplicationKey    string
	ApplicationSecret string
	ConsumerKey       string
	CLIPath           string
	HTTPClient        *http.Client
}

// NewOVHClient builds an OVHcloud client defaulting to OVH Europe (`https://eu.api.ovh.com/1.0`).
func NewOVHClient(appKey, appSecret, consumerKey, cliPath string) *OVHClient {
	if cliPath == "" {
		cliPath = `C:\Users\aphro\.local\bin\ovhcloud.exe`
	}
	return &OVHClient{
		Endpoint:          DefaultOVHEUEndpoint,
		ApplicationKey:    appKey,
		ApplicationSecret: appSecret,
		ConsumerKey:       consumerKey,
		CLIPath:           cliPath,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// String redacts OVH secrets automatically.
func (c *OVHClient) String() string {
	return fmt.Sprintf("OVHClient{Endpoint:%q, CLIPath:%q}", c.Endpoint, c.CLIPath)
}

// ComputeOVHSignature computes the official OVH `$1$<sha1(AS+"+"+CK+"+"+METHOD+"+"+URL+"+"+BODY+"+"+TSTAMP)>` signature.
func ComputeOVHSignature(appSecret, consumerKey, method, fullURL, body string, timestamp int64) string {
	preimage := fmt.Sprintf("%s+%s+%s+%s+%s+%d",
		appSecret,
		consumerKey,
		strings.ToUpper(method),
		fullURL,
		body,
		timestamp,
	)
	sum := sha1.Sum([]byte(preimage))
	return "$1$" + hex.EncodeToString(sum[:])
}

// DoSigned executes a signed OVHcloud REST API request.
func (c *OVHClient) DoSigned(ctx context.Context, method, apiPath string, payload any, out any) error {
	fullURL := strings.TrimRight(c.Endpoint, "/") + "/" + strings.TrimLeft(apiPath, "/")
	bodyStr := ""
	if payload != nil {
		raw, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		bodyStr = string(raw)
	}
	tstamp := time.Now().Unix()
	sig := ComputeOVHSignature(c.ApplicationSecret, c.ConsumerKey, method, fullURL, bodyStr, tstamp)

	var reader io.Reader
	if bodyStr != "" {
		reader = bytes.NewReader([]byte(bodyStr))
	}
	req, err := http.NewRequestWithContext(ctx, strings.ToUpper(method), fullURL, reader)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	if bodyStr != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("X-Ovh-Application", c.ApplicationKey)
	req.Header.Set("X-Ovh-Consumer", c.ConsumerKey)
	req.Header.Set("X-Ovh-Timestamp", strconv.FormatInt(tstamp, 10))
	req.Header.Set("X-Ovh-Signature", sig)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	rawResp, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ovh API %s %s HTTP %d: %s", method, apiPath, resp.StatusCode, string(rawResp))
	}
	if out != nil && len(rawResp) > 0 {
		return json.Unmarshal(rawResp, out)
	}
	return nil
}

// ListVPS queries `/vps` on OVHcloud EU.
func (c *OVHClient) ListVPS(ctx context.Context) ([]string, error) {
	var names []string
	err := c.DoSigned(ctx, http.MethodGet, "/vps", nil, &names)
	return names, err
}

// TriggerVPSSnapshot requests an automated snapshot for an OVH VPS (`POST /vps/{serviceName}/createSnapshot`).
func (c *OVHClient) TriggerVPSSnapshot(ctx context.Context, serviceName, description string) error {
	return c.DoSigned(ctx, http.MethodPost, fmt.Sprintf("/vps/%s/createSnapshot", serviceName), map[string]string{
		"description": description,
	}, nil)
}

// EnsureEdgeFirewallRule registers an OVH Edge Network Firewall rule (`POST /ip/{ip}/firewall/{ipOnFirewall}/rule`).
func (c *OVHClient) EnsureEdgeFirewallRule(ctx context.Context, ipBlock, ipOnFirewall string, sequence int, port int, protocol string) error {
	return c.DoSigned(ctx, http.MethodPost, fmt.Sprintf("/ip/%s/firewall/%s/rule", ipBlock, ipOnFirewall), map[string]any{
		"action":          "permit",
		"protocol":        protocol,
		"sequence":        sequence,
		"destinationPort": strconv.Itoa(port),
	}, nil)
}

// CLIVersion invokes `ovhcloud.exe version` to verify the local Go CLI installation.
func (c *OVHClient) CLIVersion(ctx context.Context) (string, error) {
	cmd := exec.CommandContext(ctx, c.CLIPath, "version")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("ovhcloud cli error: %w (%s)", err, strings.TrimSpace(string(out)))
	}
	return strings.TrimSpace(string(out)), nil
}
