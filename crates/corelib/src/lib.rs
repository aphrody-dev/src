// SPDX-License-Identifier: Apache-2.0
//! Sovereign Corelib — Unified GPU, RE, Emulation, and WASM surface.
//!
//! Bridges and consolidates engine, binary analysis, graphics, and web runtime
//! primitives for Shenron and RoseGriffon in the sovereign monorepo.

pub mod error;
pub mod gpu;
pub mod re;
pub mod emulation;
pub mod wasm;

pub use error::{CorelibError, Result};
pub use gpu::{GpuOptions, GpuPowerPreference, GpuReport, RowLayout};
#[cfg(feature = "gpu")]
pub use gpu::{GpuContext, RenderTarget};
pub use re::{
    AobPattern, BinaryFormat, UtfColumn, UtfTable, UtfValue, decompress_crilayla,
    decrypt_cri_block, sniff_format,
};
pub use emulation::{InputState, SimulationClock, SovereignVfs};
pub use wasm::{WasmBrowserConfig, WasmBufferPayload, WasmEngineTelemetry};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_row_layout_256_alignment() {
        let layout = RowLayout::new(100, 100, 4);
        assert_eq!(layout.bytes_per_row, 512); // 400 rounded up to next multiple of 256
        assert_eq!(layout.buffer_size, 512 * 100);
    }

    #[test]
    fn test_binary_sniffing() {
        assert_eq!(sniff_format(b"CPK \x00\x00"), BinaryFormat::CpkArchive);
        assert_eq!(sniff_format(b"@UTF\x00\x00"), BinaryFormat::UtfTable);
        assert_eq!(sniff_format(b"CRILAYLA\x00"), BinaryFormat::CrilaylaCompressed);
        assert_eq!(sniff_format(b"MZ\x90\x00"), BinaryFormat::PeExecutable);
        assert_eq!(sniff_format(&[0x7F, b'E', b'L', b'F']), BinaryFormat::ElfExecutable);
    }

    #[test]
    fn test_aob_pattern_scanning() {
        let pattern = AobPattern::from_ida_pattern("48 89 ? 55 48 8D").unwrap();
        let buffer = vec![0x90, 0x90, 0x48, 0x89, 0xE5, 0x55, 0x48, 0x8D, 0x05, 0x00];
        let matches = pattern.scan(&buffer);
        assert_eq!(matches, vec![2]);
    }

    #[test]
    fn test_simulation_clock_accumulator() {
        let mut clock = SimulationClock::new(60);
        assert_eq!(clock.current_frame, 0);

        // Advance by 1/30 second (should trigger 2 ticks at 60 FPS)
        let ticks = clock.advance(1.0 / 30.0);
        assert_eq!(ticks, 2);
        assert_eq!(clock.current_frame, 2);
    }

    #[test]
    fn test_sovereign_vfs_memory_and_mount() {
        let mut vfs = SovereignVfs::new();
        vfs.insert_file("data/script/test.lua", b"print('hello')".to_vec());

        let content = vfs.read_bytes("data/script/test.lua").unwrap();
        assert_eq!(content, b"print('hello')");
    }

    #[test]
    fn test_input_state_transitions() {
        let mut input = InputState::default();
        input.buttons_down = InputState::BUTTON_A | InputState::BUTTON_START;
        input.buttons_pressed = InputState::BUTTON_A;

        assert!(input.is_down(InputState::BUTTON_A));
        assert!(input.is_pressed(InputState::BUTTON_A));
        assert!(!input.is_pressed(InputState::BUTTON_START));

        input.end_frame();
        assert_eq!(input.buttons_pressed, 0);
        assert!(input.is_down(InputState::BUTTON_A));
    }
}
