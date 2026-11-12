//go:build !windows

package oci

import (
	"context"
	"fmt"
	"net"
	"os"
)

// DefaultDockerEndpoint returns the standard Unix Docker Engine socket endpoint.
func DefaultDockerEndpoint() string {
	if h := os.Getenv("DOCKER_HOST"); h != "" {
		return h
	}
	return "unix:///var/run/docker.sock"
}

func dialDockerNamedPipe(_ context.Context, pipePath string) (net.Conn, error) {
	return nil, fmt.Errorf("windows named pipe %s is unsupported on non-windows platforms", pipePath)
}
