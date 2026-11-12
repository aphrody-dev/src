//! Platforms without a dedicated backend yet (macOS, BSDs, wasm): report what std knows and say so.

use crate::{Disk, Gpu, Memory, Os, PciDevice, Topology, Volume, smbios};

pub fn os() -> Os {
    Os { family: std::env::consts::OS, arch: std::env::consts::ARCH.to_string(), ..Default::default() }
}
pub fn memory() -> Memory {
    Memory::default()
}
pub fn smbios(notes: &mut Vec<String>) -> Option<smbios::Smbios> {
    notes.push(format!("no low-level backend for {} yet", std::env::consts::OS));
    None
}
pub fn boot_mode() -> String {
    "unknown".into()
}
pub fn secure_boot() -> Option<bool> {
    None
}
pub fn topology(_notes: &mut Vec<String>) -> Topology {
    let threads = std::thread::available_parallelism().map_or(1, |n| n.get());
    Topology { packages: 1, cores: threads, threads, ..Default::default() }
}
pub fn cpu_names() -> (String, String) {
    (String::new(), String::new())
}
pub fn container() -> Option<(&'static str, &'static str)> {
    None
}
pub fn pci(_notes: &mut Vec<String>) -> Vec<PciDevice> {
    Vec::new()
}
pub fn gpus(_notes: &mut Vec<String>) -> Vec<Gpu> {
    Vec::new()
}
pub fn disks(_notes: &mut Vec<String>) -> Vec<Disk> {
    Vec::new()
}
pub fn volumes() -> Vec<Volume> {
    Vec::new()
}
