{ lib, rustPlatform }:

rustPlatform.buildRustPackage {
  pname = "aphrody-app";
  version = "0.1.0";
  src = ../..;
  cargoLock.lockFile = ../../Cargo.lock;
  cargoBuildFlags = [ "-p" "aphrody-host" ];
  meta = with lib; {
    description = "Pure Rust WebGPU/WGSL Wayland tiling desktop shell and WebMCP host";
    homepage = "https://aphrody.app";
    license = licenses.mit;
    mainProgram = "aphrody-app";
    platforms = platforms.unix ++ platforms.windows;
  };
}
