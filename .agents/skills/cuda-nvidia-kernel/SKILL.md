---
name: cuda-nvidia-kernel
description: Native hardware acceleration & low-level NT kernel development reference for NVIDIA RTX 4070 (Ada Lovelace sm_89), CUDA 13.4, Intel i7-13700F, and Windows NT SDK/WDK.
---

# Native NVIDIA CUDA & Windows NT Kernel Architecture

## Hardware Baseline

- **GPU**: NVIDIA GeForce RTX 4070 Desktop 12 GB GDDR6X (AD104, Ada Lovelace, Compute Capability `sm_89`).
  - Driver: 621.14 (`nvcuda.dll` & `nvapi64.dll` v32.0.16.2114).
  - CUDA Compiler / Toolkit: NVCC CUDA 13.4 (`release 13.4, V13.4.59`).
  - Graphics APIs: Vulkan 1.4.363 / Direct3D 12 Ultimate / DXCore / OpenCL 3.0 CUDA.
  - Profiling & Diagnostics: NVIDIA Nsight Compute 2026.3.0, Nsight Systems 2026.3.2, `nvidia-smi`.
- **CPU**: 13th Gen Intel Core i7-13700F (16 Cores / 24 Threads: 8 Raptor Cove P-cores + 8 Gracemont E-cores).
  - Instruction Set: AVX2, FMA3, BMI2, AES-NI, SHA-NI, SSE4.2 (Zero AVX-512).
- **RAM**: 32 GB (2x16 GB Samsung) DDR5-5800 MT/s Dual-Channel.
- **Operating System**: Windows NT 10.0.28120+ (x64).
  - Windows SDK & WDK: `10.0.28000.0` at `C:\Program Files (x86)\Windows Kits\10`.
  - MSVC C/C++ Toolchain: MSVC 14.51 (`14.51.36231`) via `cl.exe`.

## CUDA Compilation Patterns

- Compile CUDA kernels for Ada Lovelace (`sm_89`):
  ```bash
  nvcc -O3 -arch=sm_89 --ptxas-options=-v -c kernel.cu -o kernel.obj
  ```
- Generate PTX / SASS for inspection:
  ```bash
  nvcc -arch=sm_89 -ptx kernel.cu -o kernel.ptx
  cuobjdump -sass kernel.obj
  ```
- Profiling via CLI:
  ```bash
  ncu --set full -o profile_report application.exe
  nsys profile --trace=cuda,nvtx,osrt application.exe
  ```

## Windows NT Low-Level Primitives

- Memory Allocation: `VirtualAlloc2` with `MEM_RESERVE | MEM_COMMIT`, page alignment (4 KB / 2 MB large pages).
- Async I/O: I/O Completion Ports (`CreateIoCompletionPort`, `GetQueuedCompletionStatusEx`) and DirectStorage (`dstorage.dll`).
- Synchronization: Lock-free atomics, `WaitOnAddress` / `WakeByAddressSingle` in `kernel32.dll`.
