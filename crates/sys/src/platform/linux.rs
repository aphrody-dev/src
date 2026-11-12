//! Linux sources: sysfs and procfs (the kernel's stable ABI, Documentation/ABI/), plus `rustix`
//! for `uname(2)` and `statvfs(2)`. Works unprivileged; root additionally unlocks the raw SMBIOS
//! table (DIMMs, sockets).

use crate::{Disk, Gpu, Memory, Os, PciDevice, Topology, Volume, pci_class_name, smbios};
use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::Path;

fn read(path: impl AsRef<Path>) -> Option<String> {
    fs::read_to_string(path).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn hex(path: impl AsRef<Path>) -> Option<u32> {
    read(path).and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
}

/// Parses kernel CPU lists such as `0-7,16-23`.
fn cpu_list(s: &str) -> BTreeSet<usize> {
    let mut set = BTreeSet::new();
    for part in s.split(',').map(str::trim).filter(|p| !p.is_empty()) {
        match part.split_once('-') {
            Some((a, b)) => {
                if let (Ok(a), Ok(b)) = (a.parse::<usize>(), b.parse::<usize>()) {
                    set.extend(a..=b);
                }
            }
            None => {
                if let Ok(n) = part.parse() {
                    set.insert(n);
                }
            }
        }
    }
    set
}

pub fn os() -> Os {
    let rel: HashMap<String, String> = read("/etc/os-release")
        .or_else(|| read("/usr/lib/os-release"))
        .unwrap_or_default()
        .lines()
        .filter_map(|l| l.split_once('='))
        .map(|(k, v)| (k.to_string(), v.trim_matches('"').to_string()))
        .collect();
    let u = rustix::system::uname();
    Os {
        family: "linux",
        name: rel.get("PRETTY_NAME").or(rel.get("NAME")).cloned().unwrap_or_else(|| "Linux".into()),
        version: rel.get("VERSION_ID").cloned().unwrap_or_default(),
        build: rel.get("BUILD_ID").cloned().unwrap_or_default(),
        kernel: u.release().to_string_lossy().into_owned(),
        arch: u.machine().to_string_lossy().into_owned(),
        hostname: u.nodename().to_string_lossy().into_owned(),
    }
}

pub fn memory() -> Memory {
    let info: HashMap<String, u64> = read("/proc/meminfo")
        .unwrap_or_default()
        .lines()
        .filter_map(|l| {
            let (k, v) = l.split_once(':')?;
            Some((k.to_string(), v.split_whitespace().next()?.parse::<u64>().ok()? * 1024))
        })
        .collect();
    let get = |k: &str| info.get(k).copied().unwrap_or(0);
    Memory { total: get("MemTotal"), available: get("MemAvailable"), swap_total: get("SwapTotal"), swap_free: get("SwapFree") }
}

/// Raw table needs root (0400); otherwise rebuild what `/sys/class/dmi/id` exposes (0444 fields).
pub fn smbios(notes: &mut Vec<String>) -> Option<smbios::Smbios> {
    let base = Path::new("/sys/firmware/dmi/tables");
    if let (Ok(entry), Ok(table)) = (fs::read(base.join("smbios_entry_point")), fs::read(base.join("DMI"))) {
        // SMBIOS 3.x entry point `_SM3_`: major@7 minor@8; 2.x `_SM_`: major@6 minor@7.
        let version = if entry.starts_with(b"_SM3_") && entry.len() > 8 {
            (entry[7], entry[8])
        } else if entry.starts_with(b"_SM_") && entry.len() > 7 {
            (entry[6], entry[7])
        } else {
            (0, 0)
        };
        return Some(smbios::decode(version, &table));
    }
    let id = Path::new("/sys/class/dmi/id");
    if !id.exists() {
        notes.push("smbios: no DMI on this machine (device tree platform?)".into());
        return None;
    }
    notes.push("smbios: raw table is root-only; DIMMs and sockets need `sudo ay sys`".into());
    let r = |n: &str| read(id.join(n)).unwrap_or_default();
    let mut s = smbios::Smbios::default();
    s.bios.vendor = r("bios_vendor");
    s.bios.version = r("bios_version");
    s.bios.release_date = r("bios_date");
    s.bios.release = read(id.join("bios_release"));
    s.system.manufacturer = r("sys_vendor");
    s.system.product = r("product_name");
    s.system.version = r("product_version");
    s.system.family = r("product_family");
    s.system.sku = r("product_sku");
    s.baseboard.manufacturer = r("board_vendor");
    s.baseboard.product = r("board_name");
    s.baseboard.version = r("board_version");
    s.chassis.manufacturer = r("chassis_vendor");
    s.chassis.kind = r("chassis_type");
    Some(s)
}

pub fn boot_mode() -> String {
    if Path::new("/sys/firmware/efi").exists() { "UEFI" } else { "BIOS" }.to_string()
}

/// `SecureBoot-8be4df61-93ca-11d2-aa0d-00e098032b8c`: 4 attribute bytes, then 1 = enabled.
pub fn secure_boot() -> Option<bool> {
    let dir = fs::read_dir("/sys/firmware/efi/efivars").ok()?;
    for e in dir.flatten() {
        if e.file_name().to_string_lossy().starts_with("SecureBoot-") {
            return fs::read(e.path()).ok()?.get(4).map(|b| *b == 1);
        }
    }
    None
}

pub fn topology(_notes: &mut Vec<String>) -> Topology {
    let online = read("/sys/devices/system/cpu/online").map(|s| cpu_list(&s)).unwrap_or_default();
    let mut packages = BTreeSet::new();
    let mut cores = BTreeSet::new();
    for cpu in &online {
        let t = format!("/sys/devices/system/cpu/cpu{cpu}/topology");
        let pkg = read(format!("{t}/physical_package_id")).unwrap_or_default();
        let core = read(format!("{t}/core_id")).unwrap_or_default();
        packages.insert(pkg.clone());
        cores.insert((pkg, core, cluster(*cpu)));
    }
    // Intel hybrid: perf PMU device per core type lists its CPUs.
    let typed = |name: &str| read(format!("/sys/devices/{name}/cpus")).map(|s| cpu_list(&s));
    let count_cores = |set: &BTreeSet<usize>| {
        set.iter()
            .map(|c| {
                let t = format!("/sys/devices/system/cpu/cpu{c}/topology");
                (read(format!("{t}/physical_package_id")), read(format!("{t}/core_id")))
            })
            .collect::<BTreeSet<_>>()
            .len()
    };
    let (performance_cores, efficiency_cores) = match (typed("cpu_core"), typed("cpu_atom")) {
        (Some(p), Some(e)) => (Some(count_cores(&p)), Some(count_cores(&e))),
        _ => (None, None),
    };
    Topology {
        packages: packages.len().max(1),
        cores: cores.len().max(1),
        threads: online.len().max(1),
        performance_cores,
        efficiency_cores,
        max_mhz: read("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq").and_then(|k| k.parse::<u32>().ok()).map(|k| k / 1000),
    }
}

/// On some ARM/AMD parts core_id repeats across clusters; include the cluster id when present.
fn cluster(cpu: usize) -> String {
    read(format!("/sys/devices/system/cpu/cpu{cpu}/topology/cluster_id")).unwrap_or_default()
}

pub fn cpu_names() -> (String, String) {
    let info = read("/proc/cpuinfo").unwrap_or_default();
    let field = |k: &str| info.lines().find_map(|l| l.split_once(':').filter(|(a, _)| a.trim() == k).map(|(_, b)| b.trim().to_string()));
    let vendor = field("vendor_id").or_else(|| field("CPU implementer")).unwrap_or_default();
    let brand = field("model name").or_else(|| field("Hardware")).or_else(|| field("cpu model")).unwrap_or_default();
    (vendor, brand)
}

/// systemd `detect_container()` markers, plus WSL from the kernel release string.
pub fn container() -> Option<(&'static str, &'static str)> {
    if read("/proc/sys/kernel/osrelease").is_some_and(|r| r.contains("microsoft") || r.contains("WSL")) {
        return Some(("wsl", "wsl2"));
    }
    if Path::new("/run/.containerenv").exists() {
        return Some(("container", "podman"));
    }
    if Path::new("/.dockerenv").exists() {
        return Some(("container", "docker"));
    }
    if let Ok(env) = fs::read("/proc/1/environ") {
        for kv in env.split(|b| *b == 0) {
            if let Some(v) = kv.strip_prefix(b"container=") {
                return Some(("container", match v {
                    b"lxc" => "lxc",
                    b"systemd-nspawn" => "systemd-nspawn",
                    b"docker" => "docker",
                    b"podman" => "podman",
                    _ => "other",
                }));
            }
        }
    }
    None
}

/// `pci.ids` from hwdata or pciutils, parsed lazily into vendor and device names.
fn pci_names() -> HashMap<(u16, Option<u16>), String> {
    let mut map = HashMap::new();
    let text = ["/usr/share/hwdata/pci.ids", "/usr/share/misc/pci.ids", "/usr/share/pci.ids"].iter().find_map(read).unwrap_or_default();
    let mut vendor: Option<u16> = None;
    for line in text.lines() {
        if line.starts_with('#') || line.is_empty() || line.starts_with('C') && line.as_bytes().get(1) == Some(&b' ') {
            continue;
        }
        if let Some(rest) = line.strip_prefix('\t') {
            if rest.starts_with('\t') {
                continue;
            }
            if let (Some(v), Some((id, name))) = (vendor, rest.split_once("  "))
                && let Ok(d) = u16::from_str_radix(id, 16)
            {
                map.insert((v, Some(d)), name.to_string());
            }
        } else if let Some((id, name)) = line.split_once("  ") {
            vendor = u16::from_str_radix(id, 16).ok();
            if let Some(v) = vendor {
                map.insert((v, None), name.to_string());
            }
        }
    }
    map
}

pub fn pci(_notes: &mut Vec<String>) -> Vec<PciDevice> {
    let Ok(dir) = fs::read_dir("/sys/bus/pci/devices") else { return Vec::new() };
    let names = pci_names();
    let mut out: Vec<PciDevice> = dir
        .flatten()
        .filter_map(|e| {
            let p = e.path();
            let vendor_id = hex(p.join("vendor"))? as u16;
            let device_id = hex(p.join("device"))? as u16;
            let class_code = hex(p.join("class"));
            let name = match (names.get(&(vendor_id, None)), names.get(&(vendor_id, Some(device_id)))) {
                (Some(v), Some(d)) => format!("{v} {d}"),
                (Some(v), None) => v.clone(),
                _ => String::new(),
            };
            Some(PciDevice {
                address: e.file_name().to_string_lossy().into_owned(),
                vendor_id,
                device_id,
                subsystem: hex(p.join("subsystem_vendor")).zip(hex(p.join("subsystem_device"))).map(|(v, d)| (v as u16, d as u16)),
                revision: hex(p.join("revision")).map(|r| r as u8),
                class_code,
                class: class_code.map_or("Other", pci_class_name),
                name,
                driver: fs::read_link(p.join("driver")).ok().and_then(|l| l.file_name().map(|n| n.to_string_lossy().into_owned())).unwrap_or_default(),
            })
        })
        .collect();
    out.sort_by(|a, b| a.address.cmp(&b.address));
    out
}

/// Display-class PCI functions. VRAM is exposed by amdgpu (`mem_info_vram_total`) and by
/// nvidia's procfs; other drivers leave it at 0.
pub fn gpus(notes: &mut Vec<String>) -> Vec<Gpu> {
    pci(notes)
        .into_iter()
        .filter(|p| p.class_code.is_some_and(|c| c >> 16 == 0x03))
        .map(|p| {
            let dev = Path::new("/sys/bus/pci/devices").join(&p.address);
            let vram = read(dev.join("mem_info_vram_total")).and_then(|v| v.parse().ok()).unwrap_or(0);
            let driver_version = read(format!("/sys/module/{}/version", p.driver)).unwrap_or_default();
            Gpu {
                name: p.name,
                vendor_id: u32::from(p.vendor_id),
                device_id: u32::from(p.device_id),
                dedicated_memory: vram,
                shared_memory: 0,
                driver_version: if driver_version.is_empty() { p.driver } else { format!("{} {driver_version}", p.driver) },
                software: false,
            }
        })
        .collect()
}

pub fn disks(_notes: &mut Vec<String>) -> Vec<Disk> {
    let Ok(dir) = fs::read_dir("/sys/block") else { return Vec::new() };
    let mut out: Vec<Disk> = dir
        .flatten()
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            if ["loop", "ram", "dm-", "md", "sr", "fd"].iter().any(|p| name.starts_with(p)) {
                return None;
            }
            let p = e.path();
            let target = fs::read_link(&p).map(|l| l.to_string_lossy().into_owned()).unwrap_or_default();
            let bus = if name.starts_with("nvme") {
                "nvme"
            } else if name.starts_with("zram") {
                "zram"
            } else if name.starts_with("vd") || target.contains("/virtio") {
                "virtio"
            } else if target.contains("/usb") {
                "usb"
            } else if target.contains("/ata") {
                "sata"
            } else if name.starts_with("mmcblk") {
                "mmc"
            } else {
                "scsi"
            };
            let model = [read(p.join("device/vendor")), read(p.join("device/model"))].into_iter().flatten().collect::<Vec<_>>().join(" ");
            Some(Disk {
                name,
                model,
                bus: bus.to_string(),
                ssd: read(p.join("queue/rotational")).map(|r| r == "0"),
                size: read(p.join("size")).and_then(|s| s.parse::<u64>().ok()).unwrap_or(0) * 512,
                removable: read(p.join("removable")).is_some_and(|r| r == "1"),
                serial: read(p.join("device/serial")).or_else(|| read(p.join("serial"))),
            })
        })
        .collect();
    out.sort_by(|a, b| a.name.cmp(&b.name));
    out
}

pub fn volumes() -> Vec<Volume> {
    const REAL: &[&str] = &[
        "ext2", "ext3", "ext4", "xfs", "btrfs", "bcachefs", "zfs", "f2fs", "vfat", "exfat", "ntfs", "ntfs3", "fuseblk",
        "9p", "virtiofs", "drvfs", "overlay", "nfs", "nfs4", "cifs", "erofs", "squashfs",
    ];
    let mut seen = BTreeSet::new();
    read("/proc/self/mounts")
        .unwrap_or_default()
        .lines()
        .filter_map(|l| {
            let mut f = l.split_whitespace();
            let (_src, mount, fs_type) = (f.next()?, f.next()?, f.next()?);
            if !REAL.contains(&fs_type) || !seen.insert(mount.to_string()) {
                return None;
            }
            // /proc/mounts escapes spaces as \040.
            let mount = mount.replace("\\040", " ");
            let st = rustix::fs::statvfs(mount.as_str()).ok()?;
            Some(Volume {
                mount,
                file_system: fs_type.to_string(),
                label: String::new(),
                total: st.f_blocks * st.f_frsize,
                free: st.f_bavail * st.f_frsize,
                dev_drive: None,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    #[test]
    fn parses_cpu_lists() {
        let s = super::cpu_list("0-3,8,10-11\n");
        assert_eq!(s.into_iter().collect::<Vec<_>>(), vec![0, 1, 2, 3, 8, 10, 11]);
    }
}
