package providers

import (
	"context"
	"fmt"
	"os/exec"
	"strings"

	"sovereign.local/infra/internal/detect"
)

const DefaultGCPProject = "aphrody"
const DefaultGCPRegion = "europe-west1"

// GCloudDeployer plans and executes Google Cloud Run & Artifact Registry deployments (`gcloud run deploy --project=aphrody`).
type GCloudDeployer struct {
	Project            string
	Region             string
	ArtifactRepository string
	GCloudBin          string
}

// NewGCloudDeployer constructs a Cloud Run & Artifact Registry deployer.
func NewGCloudDeployer(project, region string) *GCloudDeployer {
	if project == "" {
		project = DefaultGCPProject
	}
	if region == "" {
		region = DefaultGCPRegion
	}
	return &GCloudDeployer{
		Project:            project,
		Region:             region,
		ArtifactRepository: "sovereign-oci",
		GCloudBin:          "gcloud",
	}
}

// CloudRunPlan describes the exact image ref and `gcloud` invocation for a ProjectSpec.
type CloudRunPlan struct {
	ServiceName string   `json:"serviceName"`
	Project     string   `json:"project"`
	Region      string   `json:"region"`
	ImageURI    string   `json:"imageUri"`
	Args        []string `json:"args"`
}

// Plan builds a reproducible Cloud Run deployment plan.
func (g *GCloudDeployer) Plan(spec *detect.ProjectSpec, tag string) CloudRunPlan {
	if tag == "" {
		tag = "latest"
	}
	region := g.Region
	if spec.Region == detect.RegionUSGoogleEgress {
		region = "us-east4"
	}
	imageURI := fmt.Sprintf("%s-docker.pkg.dev/%s/%s/%s:%s",
		region, g.Project, g.ArtifactRepository, spec.Name, tag)

	args := []string{
		"run", "deploy", spec.Name,
		"--project=" + g.Project,
		"--region=" + region,
		"--image=" + imageURI,
		"--platform=managed",
		"--port=" + fmt.Sprintf("%d", spec.Port),
		"--allow-unauthenticated",
		"--quiet",
	}
	return CloudRunPlan{
		ServiceName: spec.Name,
		Project:     g.Project,
		Region:      region,
		ImageURI:    imageURI,
		Args:        args,
	}
}

// Deploy executes (or dry-runs) `gcloud run deploy --project=aphrody ...`.
func (g *GCloudDeployer) Deploy(ctx context.Context, spec *detect.ProjectSpec, tag string, dryRun bool) (string, error) {
	plan := g.Plan(spec, tag)
	cmdLine := g.GCloudBin + " " + strings.Join(plan.Args, " ")
	if dryRun {
		return "[DRY-RUN] " + cmdLine, nil
	}
	cmd := exec.CommandContext(ctx, g.GCloudBin, plan.Args...)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("gcloud deploy failed: %w (%s)", err, strings.TrimSpace(string(out)))
	}
	return strings.TrimSpace(string(out)), nil
}
