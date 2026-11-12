// Package providers implements multi-cloud and self-hosted fleet adapters:
// Cloudflare REST v4 + R2 S3v4 (AWS4-HMAC-SHA256), Self-Hosted VPS Fleet (fr1, fr2, usa) + Caddy HTTP/3 + systemd,
// OVHcloud HMAC-SHA1 + CLI, Google Cloud Run / Artifact Registry, Vercel Deployments v13, and Ollama Fleet REST.
package providers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

const DefaultCloudflareAPIBase = "https://api.cloudflare.com/client/v4"
const DefaultCloudflareAccountID = "ca22c1a51a145f919b54afa18d936516"

// CloudflareClient implements Cloudflare REST API v4 for DNS, Workers, and Zero Trust Tunnels.
type CloudflareClient struct {
	APIToken   string
	AccountID  string
	BaseURL    string
	HTTPClient *http.Client
}

// NewCloudflareClient constructs a Cloudflare REST v4 client.
func NewCloudflareClient(apiToken, accountID string) *CloudflareClient {
	if accountID == "" {
		accountID = DefaultCloudflareAccountID
	}
	return &CloudflareClient{
		APIToken:  apiToken,
		AccountID: accountID,
		BaseURL:   DefaultCloudflareAPIBase,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// String redacts APIToken automatically.
func (c *CloudflareClient) String() string {
	tok := "UNSET"
	if c.APIToken != "" {
		tok = fmt.Sprintf("SET [len=%d]", len(c.APIToken))
	}
	return fmt.Sprintf("CloudflareClient{AccountID:%q, Token:%s}", c.AccountID, tok)
}

// DNSRecord represents a Cloudflare DNS record (A, AAAA, CNAME, HTTPS).
type DNSRecord struct {
	ID      string `json:"id,omitempty"`
	Type    string `json:"type"`
	Name    string `json:"name"`
	Content string `json:"content"`
	TTL     int    `json:"ttl,omitempty"`
	Proxied bool   `json:"proxied"`
}

type cfEnvelope[T any] struct {
	Success bool `json:"success"`
	Errors  []struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"errors"`
	Result T `json:"result"`
}

// UpsertDNSRecord creates or updates an A/AAAA/CNAME/HTTPS DNS record in zoneID.
func (c *CloudflareClient) UpsertDNSRecord(ctx context.Context, zoneID string, rec DNSRecord) (*DNSRecord, error) {
	if rec.TTL == 0 {
		rec.TTL = 1 // Automatic TTL when proxied
	}
	listURL := fmt.Sprintf("%s/zones/%s/dns_records?type=%s&name=%s",
		strings.TrimRight(c.BaseURL, "/"),
		url.PathEscape(zoneID),
		url.QueryEscape(rec.Type),
		url.QueryEscape(rec.Name),
	)
	var existing cfEnvelope[[]DNSRecord]
	if err := c.doJSON(ctx, http.MethodGet, listURL, nil, &existing); err != nil {
		return nil, err
	}

	method := http.MethodPost
	endpoint := fmt.Sprintf("%s/zones/%s/dns_records", strings.TrimRight(c.BaseURL, "/"), url.PathEscape(zoneID))
	if len(existing.Result) > 0 && existing.Result[0].ID != "" {
		method = http.MethodPut
		endpoint = endpoint + "/" + url.PathEscape(existing.Result[0].ID)
	}

	var saved cfEnvelope[DNSRecord]
	if err := c.doJSON(ctx, method, endpoint, rec, &saved); err != nil {
		return nil, err
	}
	return &saved.Result, nil
}

// DeployWorkerScript uploads an ES Module Worker script via Cloudflare Workers REST v4.
func (c *CloudflareClient) DeployWorkerScript(ctx context.Context, scriptName string, moduleJS []byte, compatibilityDate string) error {
	if compatibilityDate == "" {
		compatibilityDate = "2026-10-11"
	}
	endpoint := fmt.Sprintf("%s/accounts/%s/workers/scripts/%s",
		strings.TrimRight(c.BaseURL, "/"),
		url.PathEscape(c.AccountID),
		url.PathEscape(scriptName),
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, endpoint, bytes.NewReader(moduleJS))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIToken)
	req.Header.Set("Content-Type", "application/javascript+module")
	req.Header.Set("X-Cloudflare-Compatibility-Date", compatibilityDate)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("cloudflare worker deploy HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

// TunnelSummary represents a Cloudflare Zero Trust Tunnel (`cfd_tunnel`).
type TunnelSummary struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

// EnsureZeroTrustTunnel lists or creates a Cloudflare Tunnel by name.
func (c *CloudflareClient) EnsureZeroTrustTunnel(ctx context.Context, name string) (*TunnelSummary, error) {
	listURL := fmt.Sprintf("%s/accounts/%s/cfd_tunnel?name=%s&is_deleted=false",
		strings.TrimRight(c.BaseURL, "/"),
		url.PathEscape(c.AccountID),
		url.QueryEscape(name),
	)
	var existing cfEnvelope[[]TunnelSummary]
	if err := c.doJSON(ctx, http.MethodGet, listURL, nil, &existing); err != nil {
		return nil, err
	}
	if len(existing.Result) > 0 {
		return &existing.Result[0], nil
	}
	createURL := fmt.Sprintf("%s/accounts/%s/cfd_tunnel",
		strings.TrimRight(c.BaseURL, "/"),
		url.PathEscape(c.AccountID),
	)
	payload := map[string]string{
		"name":       name,
		"config_src": "cloudflare",
	}
	var created cfEnvelope[TunnelSummary]
	if err := c.doJSON(ctx, http.MethodPost, createURL, payload, &created); err != nil {
		return nil, err
	}
	return &created.Result, nil
}

func (c *CloudflareClient) doJSON(ctx context.Context, method, endpoint string, in any, out any) error {
	var body io.Reader
	if in != nil {
		raw, err := json.Marshal(in)
		if err != nil {
			return err
		}
		body = bytes.NewReader(raw)
	}
	req, err := http.NewRequestWithContext(ctx, method, endpoint, body)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIToken)
	req.Header.Set("Content-Type", "application/json")

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
		return fmt.Errorf("cloudflare API %s %s HTTP %d: %s", method, endpoint, resp.StatusCode, string(rawResp))
	}
	if out != nil {
		return json.Unmarshal(rawResp, out)
	}
	return nil
}

// ============================================================================
// Pure-Go Cloudflare R2 S3v4 (`AWS4-HMAC-SHA256`) Client
// ============================================================================

// R2Client implements pure-Go AWS Signature Version 4 signing for Cloudflare R2 (`https://<account_id>.r2.cloudflarestorage.com`).
type R2Client struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	Region          string
	Endpoint        string
	HTTPClient      *http.Client
}

// NewR2Client builds an S3v4 R2 client targeting `https://<account_id>.r2.cloudflarestorage.com`.
func NewR2Client(accountID, accessKeyID, secretAccessKey string) *R2Client {
	if accountID == "" {
		accountID = DefaultCloudflareAccountID
	}
	return &R2Client{
		AccountID:       accountID,
		AccessKeyID:     accessKeyID,
		SecretAccessKey: secretAccessKey,
		Region:          "auto",
		Endpoint:        fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID),
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// String redacts R2 credentials automatically.
func (r *R2Client) String() string {
	return fmt.Sprintf("R2Client{Endpoint:%q, Region:%q}", r.Endpoint, r.Region)
}

// SignS3v4AuthHeader computes the exact `Authorization: AWS4-HMAC-SHA256 ...` header value for R2/S3.
// Exported for both Go callers and `infra_go.dll` C-ABI FFI (`GoSignR2S3v4AuthHeader`).
func SignS3v4AuthHeader(method, rawURL, accessKey, secretKey, region, payloadHash, amzDate string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("parse url: %w", err)
	}
	if region == "" {
		region = "auto"
	}
	if payloadHash == "" {
		payloadHash = sha256Hex(nil)
	}
	if len(amzDate) < 8 {
		return "", fmt.Errorf("amzDate must be ISO8601 basic format YYYYMMDDTHHMMSSZ, got %q", amzDate)
	}
	dateStamp := amzDate[:8]
	service := "s3"

	host := u.Host
	canonicalURI := canonicalS3Path(u.Path)
	canonicalQuery := canonicalS3Query(u.Query())

	canonicalHeaders := fmt.Sprintf("host:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n",
		strings.ToLower(host), payloadHash, amzDate)
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"

	canonicalRequest := strings.Join([]string{
		strings.ToUpper(method),
		canonicalURI,
		canonicalQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	}, "\n")

	credentialScope := fmt.Sprintf("%s/%s/%s/aws4_request", dateStamp, region, service)
	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		credentialScope,
		sha256Hex([]byte(canonicalRequest)),
	}, "\n")

	signingKey := deriveS3v4SigningKey(secretKey, dateStamp, region, service)
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	authHeader := fmt.Sprintf(
		"AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		accessKey, credentialScope, signedHeaders, signature,
	)
	return authHeader, nil
}

// PresignGetURL generates an S3v4 presigned deploy artifact download URL for R2.
func (r *R2Client) PresignGetURL(bucket, key string, expiresSeconds int, now time.Time) (string, error) {
	if expiresSeconds <= 0 {
		expiresSeconds = 3600
	}
	amzDate := now.UTC().Format("20060102T150405Z")
	dateStamp := amzDate[:8]
	region := r.Region
	if region == "" {
		region = "auto"
	}
	base, err := url.Parse(strings.TrimRight(r.Endpoint, "/"))
	if err != nil {
		return "", err
	}
	base.Path = "/" + strings.TrimPrefix(bucket, "/") + "/" + strings.TrimPrefix(key, "/")

	scope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, region)
	q := url.Values{}
	q.Set("X-Amz-Algorithm", "AWS4-HMAC-SHA256")
	q.Set("X-Amz-Credential", fmt.Sprintf("%s/%s", r.AccessKeyID, scope))
	q.Set("X-Amz-Date", amzDate)
	q.Set("X-Amz-Expires", fmt.Sprintf("%d", expiresSeconds))
	q.Set("X-Amz-SignedHeaders", "host")

	canonicalURI := canonicalS3Path(base.Path)
	canonicalQuery := canonicalS3Query(q)
	canonicalHeaders := fmt.Sprintf("host:%s\n", strings.ToLower(base.Host))

	canonicalReq := strings.Join([]string{
		http.MethodGet,
		canonicalURI,
		canonicalQuery,
		canonicalHeaders,
		"host",
		"UNSIGNED-PAYLOAD",
	}, "\n")

	stringToSign := strings.Join([]string{
		"AWS4-HMAC-SHA256",
		amzDate,
		scope,
		sha256Hex([]byte(canonicalReq)),
	}, "\n")

	sigKey := deriveS3v4SigningKey(r.SecretAccessKey, dateStamp, region, "s3")
	sig := hex.EncodeToString(hmacSHA256(sigKey, []byte(stringToSign)))
	q.Set("X-Amz-Signature", sig)
	base.RawQuery = canonicalS3Query(q)
	return base.String(), nil
}

// HeadBucket checks if an R2 bucket exists and is accessible.
func (r *R2Client) HeadBucket(ctx context.Context, bucket string) error {
	targetURL := fmt.Sprintf("%s/%s", strings.TrimRight(r.Endpoint, "/"), strings.TrimPrefix(bucket, "/"))
	resp, err := r.doSigned(ctx, http.MethodHead, targetURL, nil, "")
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("r2 HeadBucket(%s) HTTP %d", bucket, resp.StatusCode)
	}
	return nil
}

// PutObject uploads a deterministic artifact to R2 using S3v4 `AWS4-HMAC-SHA256`.
func (r *R2Client) PutObject(ctx context.Context, bucket, key string, payload []byte, contentType string) (string, error) {
	targetURL := fmt.Sprintf("%s/%s/%s",
		strings.TrimRight(r.Endpoint, "/"),
		strings.TrimPrefix(bucket, "/"),
		strings.TrimPrefix(key, "/"),
	)
	resp, err := r.doSigned(ctx, http.MethodPut, targetURL, payload, contentType)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("r2 PutObject(%s/%s) HTTP %d: %s", bucket, key, resp.StatusCode, string(b))
	}
	return resp.Header.Get("ETag"), nil
}

func (r *R2Client) doSigned(ctx context.Context, method, targetURL string, payload []byte, contentType string) (*http.Response, error) {
	amzDate := time.Now().UTC().Format("20060102T150405Z")
	payloadHash := sha256Hex(payload)
	auth, err := SignS3v4AuthHeader(method, targetURL, r.AccessKeyID, r.SecretAccessKey, r.Region, payloadHash, amzDate)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, method, targetURL, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", auth)
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return r.HTTPClient.Do(req)
}

func deriveS3v4SigningKey(secret, dateStamp, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	return hmacSHA256(kService, []byte("aws4_request"))
}

func hmacSHA256(key, data []byte) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write(data)
	return mac.Sum(nil)
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func canonicalS3Path(p string) string {
	if p == "" {
		return "/"
	}
	segments := strings.Split(p, "/")
	out := make([]string, len(segments))
	for i, seg := range segments {
		out[i] = awsPercentEncode(seg)
	}
	res := strings.Join(out, "/")
	if !strings.HasPrefix(res, "/") {
		res = "/" + res
	}
	return res
}

func canonicalS3Query(q url.Values) string {
	if len(q) == 0 {
		return ""
	}
	type pair struct{ k, v string }
	var pairs []pair
	for k, vals := range q {
		ek := awsPercentEncode(k)
		for _, v := range vals {
			pairs = append(pairs, pair{k: ek, v: awsPercentEncode(v)})
		}
	}
	sort.Slice(pairs, func(i, j int) bool {
		if pairs[i].k == pairs[j].k {
			return pairs[i].v < pairs[j].v
		}
		return pairs[i].k < pairs[j].k
	})
	parts := make([]string, len(pairs))
	for i, p := range pairs {
		parts[i] = p.k + "=" + p.v
	}
	return strings.Join(parts, "&")
}

func awsPercentEncode(s string) string {
	var sb strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		isUnreserved := (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
			c == '-' || c == '_' || c == '.' || c == '~'
		if isUnreserved {
			sb.WriteByte(c)
		} else {
			fmt.Fprintf(&sb, "%%%02X", c)
		}
	}
	return sb.String()
}
