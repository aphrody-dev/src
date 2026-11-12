//go:build windows

package oci

import (
	"context"
	"fmt"
	"net"
	"os"
	"syscall"
	"time"
)

// DefaultDockerEndpoint returns the standard Windows Docker Desktop named pipe endpoint.
func DefaultDockerEndpoint() string {
	if h := os.Getenv("DOCKER_HOST"); h != "" {
		return h
	}
	return `npipe:////./pipe/docker_engine`
}

type pipeAddr string

func (p pipeAddr) Network() string { return "npipe" }
func (p pipeAddr) String() string  { return string(p) }

type pipeConn struct {
	f    *os.File
	path string
}

func (c *pipeConn) Read(b []byte) (int, error)         { return c.f.Read(b) }
func (c *pipeConn) Write(b []byte) (int, error)        { return c.f.Write(b) }
func (c *pipeConn) Close() error                       { return c.f.Close() }
func (c *pipeConn) LocalAddr() net.Addr                { return pipeAddr(c.path) }
func (c *pipeConn) RemoteAddr() net.Addr               { return pipeAddr(c.path) }
func (c *pipeConn) SetDeadline(t time.Time) error      { return c.f.SetDeadline(t) }
func (c *pipeConn) SetReadDeadline(t time.Time) error  { return c.f.SetReadDeadline(t) }
func (c *pipeConn) SetWriteDeadline(t time.Time) error { return c.f.SetWriteDeadline(t) }

func dialDockerNamedPipe(ctx context.Context, pipePath string) (net.Conn, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	pathPtr, err := syscall.UTF16PtrFromString(pipePath)
	if err != nil {
		return nil, err
	}
	handle, err := syscall.CreateFile(
		pathPtr,
		syscall.GENERIC_READ|syscall.GENERIC_WRITE,
		0,
		nil,
		syscall.OPEN_EXISTING,
		syscall.FILE_FLAG_OVERLAPPED,
		0,
	)
	if err != nil {
		return nil, fmt.Errorf("open docker named pipe %s: %w", pipePath, err)
	}
	f := os.NewFile(uintptr(handle), pipePath)
	if f == nil {
		_ = syscall.CloseHandle(handle)
		return nil, fmt.Errorf("os.NewFile returned nil for %s", pipePath)
	}
	return &pipeConn{f: f, path: pipePath}, nil
}
