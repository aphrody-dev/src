---
name: cuda-nvidia-kernel
description: CUDA kernel builds for the PC's NVIDIA RTX 4070 (Ada Lovelace, sm_89) and low-level Windows NT primitives (VirtualAlloc2, IOCP, DirectStorage, WaitOnAddress).
---

# Native NVIDIA CUDA and Windows NT primitives

## Hardware (re-read, do not trust a copied version)

- GPU: GeForce RTX 4070, compute capability 8.9 (`sm_89`). Driver and capability: `nvidia-smi --query-gpu=name,driver_version,compute_cap --format=csv`.
- CPU, RAM, OS build, SDK/WDK and MSVC versions: `ay sys` and the `windows-machine` skill (regenerate its profile when older than 7 days). The CPU has no AVX-512.
- CUDA toolkits install side by side under `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v<major.minor>\bin`; check which `nvcc` wins with `where nvcc` and `nvcc --version`. Nsight Compute (`ncu`) and Nsight Systems (`nsys`) are separate installs under `C:\Program Files\NVIDIA Corporation\`.

## CUDA compilation

```sh
nvcc -O3 -arch=sm_89 --ptxas-options=-v -c kernel.cu -o kernel.obj
nvcc -arch=sm_89 -ptx kernel.cu -o kernel.ptx      # PTX
cuobjdump -sass kernel.obj                          # SASS
ncu --set full -o profile_report application.exe
nsys profile --trace=cuda,nvtx,osrt application.exe
```

## Windows NT primitives

- Memory: `VirtualAlloc2` with `MEM_RESERVE | MEM_COMMIT`; 4 KB pages or 2 MB large pages.
- Async I/O: I/O completion ports (`CreateIoCompletionPort`, `GetQueuedCompletionStatusEx`); DirectStorage (`dstorage.dll`).
- Synchronization: lock-free atomics, `WaitOnAddress` / `WakeByAddressSingle`.
