// Package envvault provides zero-dependency loading and strict redaction for C:\src\.env.
// Secret values are never emitted in String(), GoString(), or MarshalJSON().
package envvault

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strings"
)

// DefaultEnvPath returns the canonical root .env path on Windows or Linux.
func DefaultEnvPath() string {
	if runtime.GOOS == "windows" {
		return `C:\src\.env`
	}
	return "/src/.env"
}

// Vault holds environment variables while strictly masking credentials on formatting/serialization.
type Vault struct {
	path   string
	values map[string]string
}

// Path returns the resolved .env file path.
func (v *Vault) Path() string {
	if v == nil {
		return ""
	}
	return v.path
}

// Get returns the raw value for internal cryptographic signing or auth headers.
// Never log or print the return value of Get for secret keys.
func (v *Vault) Get(key string) string {
	if v != nil {
		if val, ok := v.values[key]; ok && val != "" {
			return val
		}
	}
	return os.Getenv(key)
}

// Has reports whether a key has a non-empty value in the vault or process environment.
func (v *Vault) Has(key string) bool {
	return v.Get(key) != ""
}

// RedactedStatus returns a masked status string ("SET [len=N]", "UNSET", or non-secret value).
func (v *Vault) RedactedStatus(key string) string {
	return MaskValue(key, v.Get(key))
}

// RedactedMap returns all vault keys mapped to redacted status strings.
func (v *Vault) RedactedMap() map[string]string {
	out := make(map[string]string)
	if v == nil {
		return out
	}
	for k, val := range v.values {
		out[k] = MaskValue(k, val)
	}
	return out
}

// String implements fmt.Stringer with automatic secret redaction.
func (v *Vault) String() string {
	b, _ := json.Marshal(v.RedactedMap())
	return string(b)
}

// GoString implements fmt.GoStringer with automatic secret redaction.
func (v *Vault) GoString() string {
	return fmt.Sprintf("envvault.Vault{path:%q, keys:%d}", v.Path(), len(v.RedactedMap()))
}

// MarshalJSON implements json.Marshaler with automatic secret redaction.
func (v *Vault) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.RedactedMap())
}

// IsSecretKey reports whether a variable key or value prefix represents a credential.
func IsSecretKey(key, value string) bool {
	upper := strings.ToUpper(key)
	prefixes := []string{
		"sk-", "AIza", "figd_", "ghp_", "gho_", "github_pat_",
		"npm_", "pypi-", "ctx7sk-", "vcp_", "sbp_",
	}
	hasPrefix := false
	for _, p := range prefixes {
		if strings.HasPrefix(value, p) {
			hasPrefix = true
			break
		}
	}
	if (strings.HasSuffix(upper, "_DIR") || strings.HasSuffix(upper, "_PATH") || strings.HasSuffix(upper, "_HOME")) && !hasPrefix {
		return false
	}
	if strings.HasSuffix(upper, "_URL") && !strings.Contains(upper, "DATABASE_URL") && !hasPrefix {
		return false
	}
	if hasPrefix {
		return true
	}
	markers := []string{
		"TOKEN", "SECRET", "PASSWORD", "API_KEY", "PRIVATE_KEY",
		"AUTH", "CREDENTIAL", "DATABASE_URL", "ACCESS_KEY",
	}
	for _, m := range markers {
		if strings.Contains(upper, m) {
			return true
		}
	}
	return false
}

// MaskValue masks secret values while keeping non-secret config readable.
func MaskValue(key, value string) string {
	if value == "" {
		return "UNSET"
	}
	if IsSecretKey(key, value) {
		return fmt.Sprintf("SET [len=%d]", len(value))
	}
	return value
}

// Load reads C:\src\.env (or nearest .env walking upward from startDir) without printing raw values.
func Load(startDir string) *Vault {
	target := resolveEnvPath(startDir)
	parsed := make(map[string]string)
	if data, err := os.ReadFile(target); err == nil {
		parsed = ParseDotEnv(string(data))
	}
	keys := make([]string, 0, len(parsed))
	for k := range parsed {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	effective := make(map[string]string, len(parsed))
	for _, k := range keys {
		if existing := os.Getenv(k); existing != "" {
			effective[k] = existing
		} else {
			effective[k] = parsed[k]
		}
	}
	return &Vault{
		path:   target,
		values: effective,
	}
}

func resolveEnvPath(startDir string) string {
	dir := startDir
	if dir == "" {
		if wd, err := os.Getwd(); err == nil {
			dir = wd
		}
	}
	if dir != "" {
		if abs, err := filepath.Abs(dir); err == nil {
			cur := abs
			for {
				candidate := filepath.Join(cur, ".env")
				if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
					return candidate
				}
				parent := filepath.Dir(cur)
				if parent == cur {
					break
				}
				cur = parent
			}
		}
	}
	return DefaultEnvPath()
}

// ParseDotEnv parses standard .env content into a string map.
func ParseDotEnv(content string) map[string]string {
	result := make(map[string]string)
	lines := strings.Split(strings.ReplaceAll(content, "\r\n", "\n"), "\n")
	for _, rawLine := range lines {
		trimmed := strings.TrimSpace(rawLine)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if strings.HasPrefix(trimmed, "export ") {
			trimmed = strings.TrimSpace(strings.TrimPrefix(trimmed, "export "))
		}
		eqIdx := strings.IndexByte(trimmed, '=')
		if eqIdx <= 0 {
			continue
		}
		key := strings.TrimSpace(trimmed[:eqIdx])
		if key == "" {
			continue
		}
		rawVal := strings.TrimSpace(trimmed[eqIdx+1:])
		var val string
		if strings.HasPrefix(rawVal, `"`) {
			var sb strings.Builder
			escaped := false
			for i := 1; i < len(rawVal); i++ {
				ch := rawVal[i]
				if escaped {
					switch ch {
					case 'n':
						sb.WriteByte('\n')
					case 'r':
						sb.WriteByte('\r')
					case 't':
						sb.WriteByte('\t')
					default:
						sb.WriteByte(ch)
					}
					escaped = false
				} else if ch == '\\' {
					escaped = true
				} else if ch == '"' {
					break
				} else {
					sb.WriteByte(ch)
				}
			}
			val = sb.String()
		} else if strings.HasPrefix(rawVal, `'`) {
			rest := rawVal[1:]
			if closeIdx := strings.IndexByte(rest, '\''); closeIdx >= 0 {
				val = rest[:closeIdx]
			} else {
				val = rest
			}
		} else {
			for i := 1; i < len(rawVal); i++ {
				if rawVal[i] == '#' && (rawVal[i-1] == ' ' || rawVal[i-1] == '\t') {
					rawVal = rawVal[:i]
					break
				}
			}
			val = strings.TrimSpace(rawVal)
		}
		result[key] = val
	}
	return result
}
