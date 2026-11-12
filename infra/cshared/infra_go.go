// Package main compiles via CGO + Zig CC into `infra_go.dll` (`-buildmode=c-shared`),
// exporting C-ABI symbols consumed zero-copy by both Bun v1.4.4 (`bun:ffi`) and Rust (`windows-sys`).
package main

/*
#include <stdint.h>
*/
import "C"

import (
	"encoding/json"
	"unsafe"

	"sovereign.local/infra/internal/detect"
	"sovereign.local/infra/internal/oci"
	"sovereign.local/infra/internal/providers"
)

//export GoInfraVersion
func GoInfraVersion() C.int32_t {
	return 127
}

//export GoDetectProjectJSON
func GoDetectProjectJSON(pathPtr *C.char, outBuf *C.char, outCap C.int) C.int {
	if pathPtr == nil || outBuf == nil || outCap <= 0 {
		return -1
	}
	dir := C.GoString(pathPtr)
	spec, err := detect.DetectTarget("", dir)
	if err != nil {
		return writeCBuffer([]byte(`{"error":`+quoteJSON(err.Error())+`}`), outBuf, int(outCap), true)
	}
	raw, err := json.Marshal(spec)
	if err != nil {
		return -2
	}
	return writeCBuffer(raw, outBuf, int(outCap), false)
}

//export GoSignR2S3v4AuthHeader
func GoSignR2S3v4AuthHeader(
	method *C.char,
	urlStr *C.char,
	accessKey *C.char,
	secretKey *C.char,
	region *C.char,
	payloadHash *C.char,
	isoDate *C.char,
	outBuf *C.char,
	outCap C.int,
) C.int {
	if method == nil || urlStr == nil || accessKey == nil || secretKey == nil || isoDate == nil || outBuf == nil || outCap <= 0 {
		return -1
	}
	reg := "auto"
	if region != nil {
		if r := C.GoString(region); r != "" {
			reg = r
		}
	}
	pHash := ""
	if payloadHash != nil {
		pHash = C.GoString(payloadHash)
	}
	header, err := providers.SignS3v4AuthHeader(
		C.GoString(method),
		C.GoString(urlStr),
		C.GoString(accessKey),
		C.GoString(secretKey),
		reg,
		pHash,
		C.GoString(isoDate),
	)
	if err != nil {
		return -2
	}
	return writeCBuffer([]byte(header), outBuf, int(outCap), false)
}

//export GoComputeOciDigest
func GoComputeOciDigest(dataPtr *C.uchar, dataLen C.int, outBuf *C.char, outCap C.int) C.int {
	if outBuf == nil || outCap <= 0 || dataLen < 0 {
		return -1
	}
	var slice []byte
	if dataLen > 0 && dataPtr != nil {
		slice = C.GoBytes(unsafe.Pointer(dataPtr), dataLen)
	}
	digest := oci.ComputeDigest(slice)
	return writeCBuffer([]byte(digest), outBuf, int(outCap), false)
}

func writeCBuffer(payload []byte, outBuf *C.char, outCap int, isErr bool) C.int {
	maxCopy := outCap - 1
	if maxCopy < 0 {
		return -1
	}
	n := len(payload)
	if n > maxCopy {
		n = maxCopy
	}
	dst := unsafe.Slice((*byte)(unsafe.Pointer(outBuf)), outCap)
	copy(dst[:n], payload[:n])
	dst[n] = 0
	if isErr {
		return -2
	}
	return C.int(n)
}

func quoteJSON(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

func main() {}
