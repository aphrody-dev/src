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
pub mod epic;
pub mod web;

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
pub use epic::{
    ArcSysCelMaterial, BevyMigratedEntity, BevySceneBundle, BevyTransform, EgsManifestHeader,
    PakInfo, UAssetSummary, EGS_MANIFEST_MAGIC, PACKAGE_FILE_TAG, PAK_FILE_MAGIC,
};
pub use web::{
    AdblockCheckResult, BOQ_XSSI_PREFIX, SovereignAdblockEngine, boq_encode_f_req,
    boq_extract_chunks, boq_first_envelope, boq_parse_envelopes, boq_strip_xssi,
};

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

    #[test]
    fn test_epic_uasset_summary_parser() {
        let mut uasset_bytes = vec![0u8; 128];
        uasset_bytes[0..4].copy_from_slice(&PACKAGE_FILE_TAG.to_le_bytes()); // 0x9E2A83C1
        uasset_bytes[4..8].copy_from_slice(&(-7i32).to_le_bytes()); // legacy file version
        uasset_bytes[12..16].copy_from_slice(&(522i32).to_le_bytes()); // UE4.27
        uasset_bytes[28..32].copy_from_slice(&(42i32).to_le_bytes()); // name_count

        assert_eq!(sniff_format(&uasset_bytes), BinaryFormat::UnrealAssetPackage);

        let summary = UAssetSummary::parse(&uasset_bytes).unwrap();
        assert_eq!(summary.tag, PACKAGE_FILE_TAG);
        assert_eq!(summary.legacy_file_version, -7);
        assert_eq!(summary.file_version_ue4, 522);
        assert_eq!(summary.name_count, 42);
    }

    #[test]
    fn test_epic_pak_footer_parser() {
        let mut pak_bytes = vec![0u8; 256];
        // At byte index 200: magic 0x5A6F12E1, version 8, index_offset 1024, index_size 2048
        let pos = 200;
        pak_bytes[pos..pos + 4].copy_from_slice(&PAK_FILE_MAGIC.to_le_bytes());
        pak_bytes[pos + 4..pos + 8].copy_from_slice(&(8u32).to_le_bytes());
        pak_bytes[pos + 8..pos + 16].copy_from_slice(&(1024u64).to_le_bytes());
        pak_bytes[pos + 16..pos + 24].copy_from_slice(&(2048u64).to_le_bytes());

        assert_eq!(sniff_format(&pak_bytes), BinaryFormat::UnrealPakArchive);

        let info = PakInfo::parse(&pak_bytes).unwrap();
        assert_eq!(info.magic, PAK_FILE_MAGIC);
        assert_eq!(info.version, 8);
        assert_eq!(info.index_offset, 1024);
        assert_eq!(info.index_size, 2048);
    }

    #[test]
    fn test_epic_egs_manifest_parser() {
        let mut manifest_bytes = vec![0u8; 32];
        manifest_bytes[0..4].copy_from_slice(&EGS_MANIFEST_MAGIC.to_le_bytes()); // 0x0B83C027
        manifest_bytes[4..8].copy_from_slice(&(128u32).to_le_bytes()); // header_size
        manifest_bytes[8] = 1; // is_compressed
        manifest_bytes[12..16].copy_from_slice(&(2u32).to_le_bytes()); // version 2

        assert_eq!(sniff_format(&manifest_bytes), BinaryFormat::EgsManifest);

        let manifest = EgsManifestHeader::parse(&manifest_bytes).unwrap();
        assert_eq!(manifest.magic, EGS_MANIFEST_MAGIC);
        assert_eq!(manifest.header_size, 128);
        assert!(manifest.is_compressed);
        assert_eq!(manifest.version, 2);
    }

    #[test]
    fn test_ue5_to_bevy_coordinate_conversion() {
        // Unreal: X=100cm (Forward), Y=200cm (Right), Z=300cm (Up)
        // Bevy: X=2.0m, Y=3.0m, Z=-1.0m
        let transform = BevyTransform::from_unreal_coords(100.0, 200.0, 300.0);
        assert!((transform.translation[0] - 2.0).abs() < 1e-4);
        assert!((transform.translation[1] - 3.0).abs() < 1e-4);
        assert!((transform.translation[2] - -1.0).abs() < 1e-4);
    }

    #[test]
    fn test_bevy_scene_bundle_from_uasset() {
        let mut uasset_bytes = vec![0u8; 64];
        uasset_bytes[0..4].copy_from_slice(&PACKAGE_FILE_TAG.to_le_bytes());
        uasset_bytes[12..16].copy_from_slice(&(522i32).to_le_bytes());

        let summary = UAssetSummary::parse(&uasset_bytes).unwrap();
        let scene = BevySceneBundle::from_uasset(&summary, "HeroCharacter");

        assert_eq!(scene.scene_name, "HeroCharacter");
        assert_eq!(scene.entities.len(), 1);
        assert_eq!(scene.entities[0].entity_name, "HeroCharacter_RootActor");
        assert!(scene.entities[0].is_player);
        assert!(scene.entities[0].material.normal_steering);
    }
}
