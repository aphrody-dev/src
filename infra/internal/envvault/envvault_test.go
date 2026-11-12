package envvault

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
)

func TestVaultRedactionNeverLeaksSecrets(t *testing.T) {
	rawEnv := `
CLOUDFLARE_API_TOKEN="cf_super_secret_token_value_12345"
CLOUDFLARE_ACCOUNT_ID="ca22c1a51a145f919b54afa18d936516"
DATABASE_URL="postgres://user:topsecretpass@10.200.77.3:5432/db"
RING3_BASE_URL="http://127.0.0.1:8080"
`
	parsed := ParseDotEnv(rawEnv)
	v := &Vault{path: "C:/src/.env", values: parsed}

	s1 := fmt.Sprintf("%s", v)
	s2 := fmt.Sprintf("%#v", v)
	jb, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	s3 := string(jb)

	for _, out := range []string{s1, s2, s3} {
		if strings.Contains(out, "cf_super_secret_token_value_12345") || strings.Contains(out, "topsecretpass") {
			t.Fatalf("CRITICAL LEAK in Vault formatting: %s", out)
		}
	}
	if v.RedactedStatus("CLOUDFLARE_ACCOUNT_ID") != "ca22c1a51a145f919b54afa18d936516" {
		t.Fatalf("expected non-secret account ID to remain readable, got %s", v.RedactedStatus("CLOUDFLARE_ACCOUNT_ID"))
	}
	if !strings.HasPrefix(v.RedactedStatus("CLOUDFLARE_API_TOKEN"), "SET [len=") {
		t.Fatalf("expected masked token status, got %s", v.RedactedStatus("CLOUDFLARE_API_TOKEN"))
	}
}
