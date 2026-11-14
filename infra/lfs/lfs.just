# bun-LFS (fork aphrody-labs/lfs in third_party/lfs). Built on GitHub-hosted
# runners (.github/workflows/bunlfs.yml of the fork): never on the PC, never on prd (fleet rule 2026-11-13).

# bun-LFS (fork aphrody-labs/lfs in third_party/lfs). Built on GitHub-hosted
# runners (.github/workflows/bunlfs.yml of the fork): never on the PC, never on prd (fleet rule 2026-11-13).
lfs_repo := "aphrody-labs/lfs"

# Run the build + QEMU boot + comparisons on CI and wait for it
[group('lfs')]
lfs-build:
    gh workflow run bunlfs.yml -R {{lfs_repo}} --ref trunk
    sleep 10
    gh run watch -R {{lfs_repo}} --exit-status "$(gh run list -R {{lfs_repo}} -w bunlfs.yml -L 1 --json databaseId --jq '.[0].databaseId')"

# Archive the logs of the last successful run (QEMU serial, boot and image comparisons) into docs/lfs/logs
[group('lfs')]
lfs-logs:
    gh run download -R {{lfs_repo}} "$(gh run list -R {{lfs_repo}} -w bunlfs.yml -s success -L 1 --json databaseId --jq '.[0].databaseId')" -n bunlfs-logs -D "{{root}}/docs/lfs/logs"

# Import the rootfs of the last successful run as the WSL distribution bunlfs and run the proof
[group('lfs')]
[windows]
lfs-wsl:
    gh run download -R {{lfs_repo}} "$(gh run list -R {{lfs_repo}} -w bunlfs.yml -s success -L 1 --json databaseId --jq '.[0].databaseId')" -n bunlfs-images -D "$TEMP/bunlfs"
    -wsl --unregister bunlfs
    wsl --import bunlfs "$LOCALAPPDATA/bunlfs/wsl" "$TEMP/bunlfs/bunlfs-rootfs.tar.gz" --version 2
    wsl -d bunlfs -e /usr/bin/bun --version | tee "{{root}}/docs/lfs/logs/wsl-bun-version.txt"
    wsl -d bunlfs -e /usr/bin/bun /usr/lib/bunlfs/proof.ts | tee "{{root}}/docs/lfs/logs/wsl-proof.txt"
