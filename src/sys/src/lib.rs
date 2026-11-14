//! `ay sys`: a low-level, dependency-light profile of the machine the monorepo, its agents and its
//! apps run on. No `sysinfo`-style abstraction: each fact comes from the primary source.
//!
//! | Fact | Windows | Linux |
//! |---|---|---|
//! | firmware, board, DIMMs | `GetSystemFirmwareTable('RSMB')` + own SMBIOS parser | `/sys/firmware/dmi/tables` (root) or `/sys/class/dmi/id` |
//! | CPU model, caches, hypervisor | CPUID | CPUID (x86), `/proc/cpuinfo` (others) |
//! | cores, P/E split | `GetLogicalProcessorInformationEx` (EfficiencyClass) | `/sys/devices/system/cpu`, `/sys/devices/cpu_{core,atom}` |
//! | PCI devices | SetupAPI (`PCI` enumerator) | `/sys/bus/pci/devices` + `pci.ids` |
//! | GPUs, VRAM, driver | DXGI `IDXGIAdapter1` | sysfs (`amdgpu` VRAM), PCI class 03 |
//! | disks | `IOCTL_STORAGE_QUERY_PROPERTY` on `\\.\PhysicalDriveN` | `/sys/block` |
//! | volumes, Dev Drive | `GetVolumeInformationW`, `FSCTL_QUERY_PERSISTENT_VOLUME_STATE` | `/proc/self/mounts` + `statvfs` |
//! | virtualization | CPUID + SMBIOS (systemd `detect-virt` rules) | same + container and WSL markers |
//!
//! Every probe is best effort: what cannot be read without privileges is left empty and explained
//! in `notes`, never guessed.

use serde::Serialize;

pub mod cpuid;
mod net;
pub mod smbios;
mod toolchains;

#[cfg(target_os = "linux")]
#[path = "platform/linux.rs"]
mod platform;
#[cfg(windows)]
#[path = "platform/windows.rs"]
mod platform;
#[cfg(not(any(windows, target_os = "linux")))]
#[path = "platform/other.rs"]
mod platform;

pub use net::Interface;
pub use toolchains::Tool;

/// Bump when a field changes meaning or disappears; additions do not bump it.
pub const SCHEMA_VERSION: u32 = 2;

#[derive(Debug, Serialize)]
pub struct Profile {
    pub schema: u32,
    /// Target triple this probe was compiled for.
    pub build_target: &'static str,
    pub os: Os,
    pub virtualization: Virtualization,
    pub firmware: Firmware,
    pub cpu: Cpu,
    pub memory: Memory,
    pub pci: Vec<PciDevice>,
    pub gpus: Vec<Gpu>,
    pub disks: Vec<Disk>,
    pub volumes: Vec<Volume>,
    pub interfaces: Vec<Interface>,
    pub toolchains: Vec<Tool>,
    pub notes: Vec<String>,
}

#[derive(Debug, Default, Serialize)]
pub struct Os {
    pub family: &'static str,
    pub name: String,
    pub version: String,
    pub build: String,
    pub kernel: String,
    /// Architecture of the OS (may differ from `build_target` under emulation, e.g. x64 on ARM64).
    pub arch: String,
    pub hostname: String,
}

#[derive(Debug, Default, Serialize)]
pub struct Virtualization {
    /// `none`, `vm`, `container`, `wsl` or `hypervisor-root` (bare-metal host running Hyper-V/VBS).
    pub kind: &'static str,
    /// Technology: `hyperv`, `kvm`, `vmware`, `docker`, `podman`, `wsl2`, ...
    pub name: String,
}

#[derive(Debug, Default, Serialize)]
pub struct Firmware {
    /// `UEFI`, `BIOS` or `unknown`: how this boot happened, not what the board supports.
    pub boot_mode: String,
    pub secure_boot: Option<bool>,
    pub smbios: Option<smbios::Smbios>,
}

#[derive(Debug, Default, Serialize)]
pub struct Cpu {
    pub vendor: String,
    pub brand: String,
    pub family: u32,
    pub model: u32,
    pub stepping: u32,
    pub packages: usize,
    pub cores: usize,
    pub threads: usize,
    /// Hybrid parts (Intel Alder Lake+, ARM big.LITTLE): performance and efficiency core counts.
    pub performance_cores: Option<usize>,
    pub efficiency_cores: Option<usize>,
    pub max_mhz: Option<u32>,
    pub x86_64_level: Option<u8>,
    pub features: Vec<String>,
    pub caches: Vec<cpuid::Cache>,
}

#[derive(Debug, Default, Serialize)]
pub struct Memory {
    pub total: u64,
    pub available: u64,
    pub swap_total: u64,
    pub swap_free: u64,
}

#[derive(Debug, Serialize)]
pub struct PciDevice {
    /// `domain:bus:device.function` on Linux, location string on Windows.
    pub address: String,
    pub vendor_id: u16,
    pub device_id: u16,
    pub subsystem: Option<(u16, u16)>,
    pub revision: Option<u8>,
    /// 24-bit class code (`0x030000` = VGA controller).
    pub class_code: Option<u32>,
    pub class: &'static str,
    pub name: String,
    pub driver: String,
}

#[derive(Debug, Serialize)]
pub struct Gpu {
    pub name: String,
    pub vendor_id: u32,
    pub device_id: u32,
    pub dedicated_memory: u64,
    pub shared_memory: u64,
    pub driver_version: String,
    pub software: bool,
}

#[derive(Debug, Serialize)]
pub struct Disk {
    pub name: String,
    pub model: String,
    /// `nvme`, `sata`, `usb`, `virtio`, `scsi`, `virtual`, ...
    pub bus: String,
    pub ssd: Option<bool>,
    pub size: u64,
    pub removable: bool,
    pub serial: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Volume {
    pub mount: String,
    pub file_system: String,
    pub label: String,
    pub total: u64,
    pub free: u64,
    /// Windows Dev Drive (ReFS volume trusted for developer workloads).
    pub dev_drive: Option<bool>,
}

#[derive(Debug, Clone, Copy, Default)]
pub struct Options {
    /// Skip running `<tool> --version` for every known toolchain.
    pub skip_toolchains: bool,
    /// Keep serial numbers, UUIDs and public addresses (local profiles only, never agent context).
    pub include_identifiers: bool,
}

pub fn probe(opts: Options) -> Profile {
    let mut notes = Vec::new();

    let smbios = platform::smbios(&mut notes);
    let id = cpuid::read();
    let topo = platform::topology(&mut notes);

    let mut cpu = Cpu {
        packages: topo.packages,
        cores: topo.cores,
        threads: topo.threads,
        performance_cores: topo.performance_cores,
        efficiency_cores: topo.efficiency_cores,
        max_mhz: topo.max_mhz,
        features: features(),
        ..Default::default()
    };
    cpu.x86_64_level = x86_64_level(&cpu.features);
    if let Some(id) = &id {
        cpu.vendor = id.vendor.clone();
        cpu.brand = id.brand.clone();
        (cpu.family, cpu.model, cpu.stepping) = (id.family, id.model, id.stepping);
    } else {
        (cpu.vendor, cpu.brand) = platform::cpu_names();
    }

    let virtualization = virtualization(id.as_ref(), smbios.as_ref());
    if let Some(id) = id {
        cpu.caches = id.caches;
    }


    // CPUID reports the maximum addressable sharing, not the populated one.
    for c in &mut cpu.caches {
        c.shared_by = c.shared_by.min(cpu.threads.max(1) as u32);
    }
    if cpu.max_mhz.is_none() {
        cpu.max_mhz = smbios.as_ref().and_then(|s| s.processors.first()).and_then(|p| p.max_speed_mhz).map(u32::from);
    }

    let mut smbios = smbios;
    if !opts.include_identifiers
        && let Some(s) = smbios.as_mut()
    {
        s.system.serial.clear();
        s.system.uuid.clear();
        s.baseboard.serial.clear();
        for d in &mut s.memory_devices {
            d.serial.clear();
        }
    }
    let mut disks = platform::disks(&mut notes);
    if !opts.include_identifiers {
        for d in &mut disks {
            d.serial = None;
        }
    }

    Profile {
        schema: SCHEMA_VERSION,
        build_target: env!("SYS_BUILD_TARGET"),
        os: platform::os(),
        virtualization,
        firmware: Firmware { boot_mode: platform::boot_mode(), secure_boot: platform::secure_boot(), smbios },
        cpu,
        memory: platform::memory(),
        pci: platform::pci(&mut notes),
        gpus: platform::gpus(&mut notes),
        disks,
        volumes: platform::volumes(),
        interfaces: net::probe(opts.include_identifiers),
        toolchains: if opts.skip_toolchains { Vec::new() } else { toolchains::probe() },
        notes,
    }
}

/// Topology facts the platform layer reports.
#[derive(Debug, Default)]
pub(crate) struct Topology {
    pub packages: usize,
    pub cores: usize,
    pub threads: usize,
    pub performance_cores: Option<usize>,
    pub efficiency_cores: Option<usize>,
    pub max_mhz: Option<u32>,
}

/// systemd `detect-virt` order: containers first, then DMI vendor strings, then CPUID.
fn virtualization(id: Option<&cpuid::CpuId>, smbios: Option<&smbios::Smbios>) -> Virtualization {
    if let Some((kind, name)) = platform::container() {
        return Virtualization { kind, name: name.to_string() };
    }
    let hv = id.and_then(|i| i.hypervisor.as_ref());
    if let Some(h) = hv
        && h.root_partition
    {
        return Virtualization { kind: "hypervisor-root", name: h.name.to_string() };
    }
    if let Some(s) = smbios {
        let hay = [&s.system.manufacturer, &s.system.product, &s.bios.vendor, &s.baseboard.manufacturer];
        let dmi = [
            ("KVM", "kvm"),
            ("Amazon EC2", "amazon"),
            ("QEMU", "qemu"),
            ("VMware", "vmware"),
            ("VMW", "vmware"),
            ("innotek GmbH", "oracle"),
            ("VirtualBox", "oracle"),
            ("Oracle Corporation", "oracle"),
            ("Xen", "xen"),
            ("Bochs", "bochs"),
            ("Parallels", "parallels"),
            ("BHYVE", "bhyve"),
            ("Hyper-V", "microsoft"),
            ("Apple Virtualization", "apple"),
            ("Google Compute Engine", "google"),
        ];
        for (needle, name) in dmi {
            if hay.iter().any(|h| h.contains(needle)) {
                return Virtualization { kind: "vm", name: name.to_string() };
            }
        }
        if s.system.manufacturer == "Microsoft Corporation" && s.system.product == "Virtual Machine" {
            return Virtualization { kind: "vm", name: "microsoft".into() };
        }
    }
    match hv {
        Some(h) => Virtualization { kind: "vm", name: h.name.to_string() },
        None => Virtualization { kind: "none", name: String::new() },
    }
}

#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
fn features() -> Vec<String> {
    macro_rules! detect {
        ($($f:tt),* $(,)?) => {{
            let mut v = Vec::new();
            $( if std::arch::is_x86_feature_detected!($f) { v.push($f.to_string()); } )*
            v
        }};
    }
    detect!(
        "sse3", "ssse3", "sse4.1", "sse4.2", "popcnt", "cmpxchg16b", "avx", "avx2", "bmi1", "bmi2",
        "fma", "f16c", "lzcnt", "movbe", "xsave", "avx512f", "avx512bw", "avx512cd", "avx512dq",
        "avx512vl", "avx512vnni", "sha", "aes", "pclmulqdq", "vaes", "vpclmulqdq", "gfni", "rdrand",
        "rdseed", "adx",
    )
}

#[cfg(target_arch = "aarch64")]
fn features() -> Vec<String> {
    macro_rules! detect {
        ($($f:tt),* $(,)?) => {{
            let mut v = Vec::new();
            $( if std::arch::is_aarch64_feature_detected!($f) { v.push($f.to_string()); } )*
            v
        }};
    }
    detect!("neon", "aes", "sha2", "sha3", "crc", "lse", "rdm", "dotprod", "fp16", "sve", "sve2", "bf16", "i8mm")
}

#[cfg(not(any(target_arch = "x86", target_arch = "x86_64", target_arch = "aarch64")))]
fn features() -> Vec<String> {
    Vec::new()
}

/// x86-64 psABI microarchitecture levels (v2 SSE4.2, v3 AVX2/BMI/FMA, v4 AVX-512).
fn x86_64_level(f: &[String]) -> Option<u8> {
    if !cfg!(target_arch = "x86_64") {
        return None;
    }
    let has = |names: &[&str]| names.iter().all(|n| f.iter().any(|x| x == n));
    let mut level = 1;
    if has(&["cmpxchg16b", "popcnt", "sse3", "ssse3", "sse4.1", "sse4.2"]) {
        level = 2;
        if has(&["avx", "avx2", "bmi1", "bmi2", "f16c", "fma", "lzcnt", "movbe", "xsave"]) {
            level = 3;
            if has(&["avx512f", "avx512bw", "avx512cd", "avx512dq", "avx512vl"]) {
                level = 4;
            }
        }
    }
    Some(level)
}

/// PCI base class names (PCI Code and ID Assignment Specification, section 1).
pub(crate) fn pci_class_name(class_code: u32) -> &'static str {
    match (class_code >> 16, (class_code >> 8) & 0xff) {
        (0x01, 0x08) => "NVMe controller",
        (0x01, 0x06) => "SATA controller",
        (0x01, _) => "Storage controller",
        (0x02, _) => "Network controller",
        (0x03, 0x00) => "VGA controller",
        (0x03, 0x02) => "3D controller",
        (0x03, _) => "Display controller",
        (0x04, 0x03) => "Audio device",
        (0x04, _) => "Multimedia controller",
        (0x05, _) => "Memory controller",
        (0x06, 0x04) => "PCI bridge",
        (0x06, _) => "Bridge",
        (0x07, _) => "Communication controller",
        (0x08, _) => "System peripheral",
        (0x09, _) => "Input device",
        (0x0c, 0x03) => "USB controller",
        (0x0c, 0x05) => "SMBus controller",
        (0x0c, _) => "Serial bus controller",
        (0x0d, _) => "Wireless controller",
        (0x10, _) => "Encryption controller",
        (0x11, _) => "Signal processing controller",
        (0x12, _) => "Processing accelerator",
        _ => "Other",
    }
}

impl Profile {
    /// Plain-text summary for agent context: no identifiers, one fact per line.
    pub fn summary(&self) -> String {
        use std::fmt::Write;
        let gib = |b: u64| b as f64 / (1u64 << 30) as f64;
        let mut s = String::new();
        let o = &self.os;
        let _ = writeln!(s, "os: {} {} (build {}), kernel {}, {} on {}", o.name, o.version, o.build, o.kernel, o.arch, self.build_target);
        let v = &self.virtualization;
        let _ = writeln!(s, "virtualization: {}{}", v.kind, if v.name.is_empty() { String::new() } else { format!(" ({})", v.name) });
        let f = &self.firmware;
        let _ = writeln!(s, "boot: {}, secure boot {}", f.boot_mode, f.secure_boot.map_or("unknown", |b| if b { "on" } else { "off" }));
        if let Some(sm) = &f.smbios {
            let _ = writeln!(s, "system: {} {} ({}), SMBIOS {}", sm.system.manufacturer, sm.system.product, sm.chassis.kind, sm.version);
            let _ = writeln!(s, "board: {} {} {}", sm.baseboard.manufacturer, sm.baseboard.product, sm.baseboard.version);
            let _ = writeln!(s, "bios: {} {} ({}){}", sm.bios.vendor, sm.bios.version, sm.bios.release_date, sm.bios.release.as_ref().map_or(String::new(), |r| format!(", release {r}")));
            for a in &sm.memory_arrays {
                let _ = writeln!(s, "memory slots: {} (max {:.0} GiB, ECC {})", a.slots.unwrap_or(0), gib(a.max_capacity_bytes.unwrap_or(0)), a.ecc);
            }
            for d in &sm.memory_devices {
                let _ = writeln!(
                    s,
                    "dimm: {} {:.0} GiB {} {} {} MT/s (configured {}){} {} {}",
                    d.locator,
                    gib(d.size_bytes),
                    d.kind,
                    d.form_factor,
                    d.speed_mts.map_or("?".into(), |v| v.to_string()),
                    d.configured_speed_mts.map_or("?".into(), |v| v.to_string()),
                    d.configured_voltage_mv.map_or(String::new(), |mv| format!(" {mv} mV")),
                    d.manufacturer,
                    d.part_number
                );
            }
        }
        let c = &self.cpu;
        let hybrid = match (c.performance_cores, c.efficiency_cores) {
            (Some(p), Some(e)) => format!(", {p}P+{e}E"),
            _ => String::new(),
        };
        let _ = writeln!(
            s,
            "cpu: {} [{} family {:#x} model {:#x} stepping {}], {} package(s), {} cores{}, {} threads{}{}",
            c.brand,
            c.vendor,
            c.family,
            c.model,
            c.stepping,
            c.packages,
            c.cores,
            hybrid,
            c.threads,
            c.max_mhz.map_or(String::new(), |m| format!(", max {m} MHz")),
            c.x86_64_level.map_or(String::new(), |l| format!(", x86-64-v{l}"))
        );
        let caches: Vec<String> = c
            .caches
            .iter()
            .map(|k| format!("L{}{} {} KiB/{}T", k.level, if k.kind == "data" { "d" } else if k.kind == "instruction" { "i" } else { "" }, k.size_bytes / 1024, k.shared_by))
            .collect();
        if !caches.is_empty() {
            let _ = writeln!(s, "caches: {}", caches.join(", "));
        }
        if !c.features.is_empty() {
            let _ = writeln!(s, "cpu features: {}", c.features.join(" "));
        }
        let m = &self.memory;
        let _ = writeln!(s, "memory: {:.1} GiB total, {:.1} GiB available, swap {:.1}/{:.1} GiB free", gib(m.total), gib(m.available), gib(m.swap_free), gib(m.swap_total));
        for g in &self.gpus {
            let _ = writeln!(s, "gpu: {} [{:04x}:{:04x}] {:.1} GiB dedicated, driver {}{}", g.name, g.vendor_id, g.device_id, gib(g.dedicated_memory), g.driver_version, if g.software { ", software" } else { "" });
        }
        for p in self.pci.iter().filter(|p| !matches!(p.class, "PCI bridge" | "Bridge" | "System peripheral" | "SMBus controller" | "Serial bus controller" | "Memory controller" | "Other")) {
            let _ = writeln!(s, "pci: {} [{:04x}:{:04x}] {}{}", p.class, p.vendor_id, p.device_id, p.name, if p.driver.is_empty() { String::new() } else { format!(" ({})", p.driver) });
        }
        for d in &self.disks {
            let _ = writeln!(s, "disk: {} {} {} {:.0} GiB{}{}", d.name, d.model, d.bus, d.size as f64 / 1e9, d.ssd.map_or("", |x| if x { " SSD" } else { " HDD" }), if d.removable { " removable" } else { "" });
        }
        for v in &self.volumes {
            let _ = writeln!(s, "volume: {} {} {:.0}/{:.0} GiB free{}", v.mount, v.file_system, gib(v.free), gib(v.total), if v.dev_drive == Some(true) { ", Dev Drive" } else { "" });
        }
        for i in self.interfaces.iter().filter(|i| !i.loopback) {
            let _ = writeln!(s, "net: {} {}", i.name, i.addresses.join(" "));
        }
        let tools: Vec<String> = self.toolchains.iter().map(|t| format!("{} {}", t.name, t.version)).collect();
        if !tools.is_empty() {
            let _ = writeln!(s, "tools: {}", tools.join(", "));
        }
        for n in &self.notes {
            let _ = writeln!(s, "note: {n}");
        }
        s
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn x86_64_levels_follow_the_psabi() {
        if !cfg!(target_arch = "x86_64") {
            return;
        }
        let v = |s: &[&str]| s.iter().map(|x| x.to_string()).collect::<Vec<_>>();
        let v2 = ["cmpxchg16b", "popcnt", "sse3", "ssse3", "sse4.1", "sse4.2"];
        assert_eq!(x86_64_level(&v(&["avx2"])), Some(1));
        assert_eq!(x86_64_level(&v(&v2)), Some(2));
        let mut v3 = v2.to_vec();
        v3.extend(["avx", "avx2", "bmi1", "bmi2", "f16c", "fma", "lzcnt", "movbe", "xsave"]);
        assert_eq!(x86_64_level(&v(&v3)), Some(3));
    }

    #[test]
    fn pci_classes() {
        assert_eq!(pci_class_name(0x030000), "VGA controller");
        assert_eq!(pci_class_name(0x010802), "NVMe controller");
        assert_eq!(pci_class_name(0x020000), "Network controller");
    }

    #[test]
    fn root_partition_is_not_a_vm() {
        let id = cpuid::CpuId {
            hypervisor: Some(cpuid::Hypervisor { signature: "Microsoft Hv".into(), name: "hyperv", root_partition: true }),
            ..Default::default()
        };
        let v = virtualization(Some(&id), None);
        if platform::container().is_none() {
            assert_eq!(v.kind, "hypervisor-root");
        }
    }

    #[test]
    fn probe_runs_without_identifiers() {
        let p = probe(Options { skip_toolchains: true, include_identifiers: false });
        assert!(p.cpu.threads >= 1);
        assert!(p.memory.total > 0);
        if let Some(s) = &p.firmware.smbios {
            assert!(s.system.serial.is_empty() && s.system.uuid.is_empty());
        }
        assert!(p.disks.iter().all(|d| d.serial.is_none()));
    }
}
