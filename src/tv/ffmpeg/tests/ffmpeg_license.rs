//! Licence gate (docs/ARCHITECTURE.md §11): the libav* this crate links at run time must be an
//! LGPL build. A GPL or non-free FFmpeg would change the licence of every `tv-*` binary.

#[test]
#[ignore = "release gate: run with --ignored on the host that builds distributable tv-* binaries"]
fn ffmpeg_build_is_lgpl() {
    tv_ffmpeg::init().expect("FFmpeg libraries load");
    let config = tv_ffmpeg::ff::util::configuration();
    // LGPL-2.1 only: --enable-version3 turns the build into LGPL-3.0 (not admitted, §11).
    for flag in ["--enable-gpl", "--enable-nonfree", "--enable-version3"] {
        assert!(!config.contains(flag), "FFmpeg built with {flag}: {config}");
    }
    let license = tv_ffmpeg::ff::util::license();
    assert!(
        license.starts_with("LGPL"),
        "FFmpeg licence is {license}, expected LGPL"
    );
}
