//! Windows sources. Flat Win32 calls go through `windows-sys` (raw, zero-cost); DXGI is COM and
//! goes through `windows`. Nothing here needs administrator rights.

use crate::{Disk, Gpu, Memory, Os, PciDevice, Topology, Volume, pci_class_name, smbios};
use std::ffi::c_void;
use std::mem::{size_of, zeroed};
use std::ptr::{null, null_mut};
use windows_sys::Win32::Devices::DeviceAndDriverInstallation::{
    DIGCF_ALLCLASSES, DIGCF_PRESENT, SP_DEVINFO_DATA, SPDRP_COMPATIBLEIDS, SPDRP_DEVICEDESC, SPDRP_HARDWAREID,
    SPDRP_LOCATION_INFORMATION, SPDRP_SERVICE, SetupDiDestroyDeviceInfoList, SetupDiEnumDeviceInfo, SetupDiGetClassDevsW,
    SetupDiGetDeviceRegistryPropertyW,
};
use windows_sys::Win32::Foundation::{CloseHandle, HANDLE, INVALID_HANDLE_VALUE};
use windows_sys::Win32::Storage::FileSystem::{
    CreateFileW, FILE_FLAG_BACKUP_SEMANTICS, FILE_SHARE_DELETE, FILE_SHARE_READ, FILE_SHARE_WRITE, GetDiskFreeSpaceExW,
    GetDriveTypeW, GetLogicalDrives, GetVolumeInformationW, OPEN_EXISTING,
};
use windows_sys::Win32::System::IO::DeviceIoControl;
use windows_sys::Win32::System::Ioctl::{
    FSCTL_QUERY_PERSISTENT_VOLUME_STATE, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, IOCTL_STORAGE_QUERY_PROPERTY,
};
use windows_sys::Win32::System::Registry::{HKEY, HKEY_LOCAL_MACHINE, RRF_RT_REG_DWORD, RRF_RT_REG_SZ, RegGetValueW};
use windows_sys::Win32::System::SystemInformation::{
    ComputerNameDnsHostname, FIRMWARE_TYPE, FirmwareTypeBios, FirmwareTypeUefi, GetComputerNameExW, GetFirmwareType,
    GetLogicalProcessorInformationEx, GetNativeSystemInfo, GetSystemFirmwareTable, GlobalMemoryStatusEx, MEMORYSTATUSEX,
    RelationAll, SYSTEM_INFO,
};

fn wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(Some(0)).collect()
}

fn from_wide(buf: &[u16]) -> String {
    let end = buf.iter().position(|c| *c == 0).unwrap_or(buf.len());
    String::from_utf16_lossy(&buf[..end]).trim().to_string()
}

fn reg_string(root: HKEY, key: &str, value: &str) -> Option<String> {
    let (k, v) = (wide(key), wide(value));
    let mut buf = vec![0u16; 512];
    let mut len = (buf.len() * 2) as u32;
    // SAFETY: NUL-terminated UTF-16 key/value names; `buf` holds `len` bytes.
    let rc = unsafe { RegGetValueW(root, k.as_ptr(), v.as_ptr(), RRF_RT_REG_SZ, null_mut(), buf.as_mut_ptr().cast(), &mut len) };
    (rc == 0).then(|| from_wide(&buf))
}

fn reg_dword(root: HKEY, key: &str, value: &str) -> Option<u32> {
    let (k, v) = (wide(key), wide(value));
    let mut data = 0u32;
    let mut len = 4u32;
    // SAFETY: DWORD-sized output buffer.
    let rc = unsafe { RegGetValueW(root, k.as_ptr(), v.as_ptr(), RRF_RT_REG_DWORD, null_mut(), (&mut data as *mut u32).cast(), &mut len) };
    (rc == 0).then_some(data)
}

const NT_KEY: &str = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion";

pub fn os() -> Os {
    let build = reg_string(HKEY_LOCAL_MACHINE, NT_KEY, "CurrentBuild").unwrap_or_default();
    let ubr = reg_dword(HKEY_LOCAL_MACHINE, NT_KEY, "UBR");
    let mut name = reg_string(HKEY_LOCAL_MACHINE, NT_KEY, "ProductName").unwrap_or_else(|| "Windows".into());
    // ProductName still says "Windows 10" on Windows 11; build 22000 is the first Windows 11 build.
    if build.parse::<u32>().is_ok_and(|b| b >= 22000) {
        name = name.replacen("Windows 10", "Windows 11", 1);
    }
    // SAFETY: SYSTEM_INFO is plain data filled by the call.
    let arch = unsafe {
        let mut si: SYSTEM_INFO = zeroed();
        GetNativeSystemInfo(&mut si);
        match si.Anonymous.Anonymous.wProcessorArchitecture {
            9 => "x86_64",
            12 => "aarch64",
            5 => "arm",
            0 => "x86",
            _ => "unknown",
        }
    };
    let mut host = vec![0u16; 256];
    let mut n = host.len() as u32;
    // SAFETY: `n` is the buffer length in characters.
    let hostname = if unsafe { GetComputerNameExW(ComputerNameDnsHostname, host.as_mut_ptr(), &mut n) } != 0 { from_wide(&host) } else { String::new() };
    Os {
        family: "windows",
        name,
        version: reg_string(HKEY_LOCAL_MACHINE, NT_KEY, "DisplayVersion").unwrap_or_default(),
        build: ubr.map_or(build.clone(), |u| format!("{build}.{u}")),
        kernel: format!("NT {}", reg_string(HKEY_LOCAL_MACHINE, NT_KEY, "CurrentMajorVersionNumber").unwrap_or_else(|| "10.0".into())),
        arch: arch.to_string(),
        hostname,
    }
}

pub fn memory() -> Memory {
    // SAFETY: dwLength must be set before the call.
    unsafe {
        let mut m: MEMORYSTATUSEX = zeroed();
        m.dwLength = size_of::<MEMORYSTATUSEX>() as u32;
        if GlobalMemoryStatusEx(&mut m) == 0 {
            return Memory::default();
        }
        // ullTotalPageFile is the commit limit (RAM + page files).
        Memory {
            total: m.ullTotalPhys,
            available: m.ullAvailPhys,
            swap_total: m.ullTotalPageFile.saturating_sub(m.ullTotalPhys),
            swap_free: m.ullAvailPageFile.saturating_sub(m.ullAvailPhys),
        }
    }
}

/// `RawSMBIOSData`: Used20CallingMethod, Major, Minor, DmiRevision, Length:u32, then the table.
pub fn smbios(notes: &mut Vec<String>) -> Option<smbios::Smbios> {
    let rsmb = u32::from_be_bytes(*b"RSMB");
    // SAFETY: first call with a null buffer returns the required size.
    let size = unsafe { GetSystemFirmwareTable(rsmb, 0, null_mut(), 0) };
    if size < 8 {
        notes.push("smbios: GetSystemFirmwareTable(RSMB) returned no table".into());
        return None;
    }
    let mut buf = vec![0u8; size as usize];
    // SAFETY: `buf` holds exactly `size` bytes.
    let got = unsafe { GetSystemFirmwareTable(rsmb, 0, buf.as_mut_ptr().cast(), size) };
    if got != size {
        notes.push("smbios: firmware table changed size between calls".into());
        return None;
    }
    let len = u32::from_le_bytes(buf[4..8].try_into().ok()?) as usize;
    let table = buf.get(8..8 + len)?;
    Some(smbios::decode((buf[1], buf[2]), table))
}

pub fn boot_mode() -> String {
    let mut kind: FIRMWARE_TYPE = 0;
    // SAFETY: writes one FIRMWARE_TYPE.
    let ok = unsafe { GetFirmwareType(&mut kind) } != 0;
    match (ok, kind) {
        (true, k) if k == FirmwareTypeUefi => "UEFI",
        (true, k) if k == FirmwareTypeBios => "BIOS",
        _ => "unknown",
    }
    .to_string()
}

pub fn secure_boot() -> Option<bool> {
    reg_dword(HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\SecureBoot\State", "UEFISecureBootEnabled").map(|v| v == 1)
}

/// Walks `SYSTEM_LOGICAL_PROCESSOR_INFORMATION_EX` records. Layout (winnt.h): Relationship:u32,
/// Size:u32, then for RelationProcessorCore(0)/Package(3) a PROCESSOR_RELATIONSHIP: Flags:u8,
/// EfficiencyClass:u8, Reserved[20], GroupCount:u16, GroupMask[GroupCount] (16 bytes each, mask
/// first). EfficiencyClass is higher for faster cores; all zero on non-hybrid parts.
pub fn topology(notes: &mut Vec<String>) -> Topology {
    let mut len = 0u32;
    // SAFETY: size query with a null buffer.
    unsafe { GetLogicalProcessorInformationEx(RelationAll, null_mut(), &mut len) };
    let mut buf = vec![0u8; len as usize];
    // SAFETY: `buf` holds `len` bytes, 8-byte alignment is not required by the API for u8 buffers
    // because every record is read below through byte offsets.
    if unsafe { GetLogicalProcessorInformationEx(RelationAll, buf.as_mut_ptr().cast(), &mut len) } == 0 {
        notes.push("cpu: GetLogicalProcessorInformationEx failed".into());
        return Topology::default();
    }
    let u16_at = |b: &[u8], o: usize| u16::from_le_bytes([b[o], b[o + 1]]);
    let u32_at = |b: &[u8], o: usize| u32::from_le_bytes(b[o..o + 4].try_into().unwrap_or_default());
    let u64_at = |b: &[u8], o: usize| u64::from_le_bytes(b[o..o + 8].try_into().unwrap_or_default());

    let mut t = Topology::default();
    let mut classes: Vec<u8> = Vec::new();
    let mut off = 0usize;
    while off + 8 <= len as usize {
        let rel = u32_at(&buf, off);
        let size = u32_at(&buf, off + 4) as usize;
        if size == 0 || off + size > buf.len() {
            break;
        }
        let rec = &buf[off..off + size];
        match rel {
            0 => {
                t.cores += 1;
                classes.push(rec[9]);
                let groups = usize::from(u16_at(rec, 30));
                for g in 0..groups {
                    let m = 32 + g * 16;
                    if m + 8 <= rec.len() {
                        t.threads += u64_at(rec, m).count_ones() as usize;
                    }
                }
            }
            3 => t.packages += 1,
            _ => {}
        }
        off += size;
    }
    let max = classes.iter().copied().max().unwrap_or(0);
    if max > 0 {
        t.performance_cores = Some(classes.iter().filter(|c| **c == max).count());
        t.efficiency_cores = Some(classes.iter().filter(|c| **c != max).count());
    }
    t
}

pub fn cpu_names() -> (String, String) {
    let key = r"HARDWARE\DESCRIPTION\System\CentralProcessor\0";
    (
        reg_string(HKEY_LOCAL_MACHINE, key, "VendorIdentifier").unwrap_or_default(),
        reg_string(HKEY_LOCAL_MACHINE, key, "ProcessorNameString").unwrap_or_default(),
    )
}

pub fn container() -> Option<(&'static str, &'static str)> {
    None
}

/// SetupAPI enumeration of the `PCI` enumerator: hardware IDs carry VEN/DEV/SUBSYS/REV, the
/// compatible IDs carry the class code (`PCI\CC_030000`).
pub fn pci(notes: &mut Vec<String>) -> Vec<PciDevice> {
    let enumerator = wide("PCI");
    // SAFETY: valid NUL-terminated enumerator; the set is destroyed below.
    let set = unsafe { SetupDiGetClassDevsW(null(), enumerator.as_ptr(), null_mut(), DIGCF_PRESENT | DIGCF_ALLCLASSES) };
    if set == INVALID_HANDLE_VALUE as isize {
        notes.push("pci: SetupDiGetClassDevsW failed".into());
        return Vec::new();
    }
    let prop = |data: &SP_DEVINFO_DATA, which: u32| -> Vec<String> {
        let mut buf = vec![0u8; 4096];
        let mut needed = 0u32;
        // SAFETY: `buf` length is passed; the device belongs to `set`.
        let ok = unsafe { SetupDiGetDeviceRegistryPropertyW(set, data, which, null_mut(), buf.as_mut_ptr(), buf.len() as u32, &mut needed) };
        if ok == 0 {
            return Vec::new();
        }
        let wide: Vec<u16> = buf[..needed as usize].as_chunks::<2>().0.iter().map(|c| u16::from_le_bytes(*c)).collect();
        wide.split(|c| *c == 0).filter(|s| !s.is_empty()).map(String::from_utf16_lossy).collect()
    };
    let mut out = Vec::new();
    for index in 0.. {
        // SAFETY: cbSize must be set; SP_DEVINFO_DATA is plain data.
        let mut data: SP_DEVINFO_DATA = unsafe { zeroed() };
        data.cbSize = size_of::<SP_DEVINFO_DATA>() as u32;
        if unsafe { SetupDiEnumDeviceInfo(set, index, &mut data) } == 0 {
            break;
        }
        let ids = prop(&data, SPDRP_HARDWAREID);
        let Some(hw) = ids.first() else { continue };
        // `PCI\VEN_10DE&DEV_2786&SUBSYS_88DE1043&REV_A1`: split on both separators.
        let field = |s: &str, key: &str| s.split(['&', '\\']).find_map(|p| p.strip_prefix(key)).map(str::to_string);
        let hex16 = |v: Option<String>| v.and_then(|x| u16::from_str_radix(&x, 16).ok());
        let (Some(vendor_id), Some(device_id)) = (hex16(field(hw, "VEN_")), hex16(field(hw, "DEV_"))) else { continue };
        let subsystem = field(hw, "SUBSYS_").and_then(|s| u32::from_str_radix(&s, 16).ok()).map(|v| ((v & 0xffff) as u16, (v >> 16) as u16));
        let revision = field(hw, "REV_").and_then(|r| u8::from_str_radix(&r, 16).ok());
        let class_code = prop(&data, SPDRP_COMPATIBLEIDS).iter().find_map(|c| field(c, "CC_")).and_then(|c| u32::from_str_radix(&format!("{c:0<6}")[..6], 16).ok());
        out.push(PciDevice {
            address: prop(&data, SPDRP_LOCATION_INFORMATION).into_iter().next().unwrap_or_default(),
            vendor_id,
            device_id,
            subsystem,
            revision,
            class_code,
            class: class_code.map_or("Other", pci_class_name),
            name: prop(&data, SPDRP_DEVICEDESC).into_iter().next().unwrap_or_default(),
            driver: prop(&data, SPDRP_SERVICE).into_iter().next().unwrap_or_default(),
        });
    }
    // SAFETY: `set` came from SetupDiGetClassDevsW.
    unsafe { SetupDiDestroyDeviceInfoList(set) };
    out
}

/// DXGI adapters: dedicated VRAM and the user-mode driver version (`CheckInterfaceSupport`).
pub fn gpus(notes: &mut Vec<String>) -> Vec<Gpu> {
    use windows::Win32::Graphics::Dxgi::{CreateDXGIFactory1, DXGI_ADAPTER_FLAG_SOFTWARE, IDXGIDevice, IDXGIFactory1};
    use windows::core::Interface;
    // SAFETY: COM calls on interfaces returned by DXGI itself.
    let factory: IDXGIFactory1 = match unsafe { CreateDXGIFactory1() } {
        Ok(f) => f,
        Err(e) => {
            notes.push(format!("gpu: CreateDXGIFactory1: {e}"));
            return Vec::new();
        }
    };
    let mut out = Vec::new();
    for i in 0.. {
        let Ok(adapter) = (unsafe { factory.EnumAdapters1(i) }) else { break };
        let Ok(d) = (unsafe { adapter.GetDesc1() }) else { continue };
        let driver_version = unsafe { adapter.CheckInterfaceSupport(&IDXGIDevice::IID) }
            .map(|v| {
                let v = v as u64;
                format!("{}.{}.{}.{}", v >> 48, (v >> 32) & 0xffff, (v >> 16) & 0xffff, v & 0xffff)
            })
            .unwrap_or_default();
        out.push(Gpu {
            name: from_wide(&d.Description),
            vendor_id: d.VendorId,
            device_id: d.DeviceId,
            dedicated_memory: d.DedicatedVideoMemory as u64,
            shared_memory: d.SharedSystemMemory as u64,
            driver_version,
            software: d.Flags & DXGI_ADAPTER_FLAG_SOFTWARE.0 as u32 != 0,
        });
    }
    out
}

struct Handle(HANDLE);
impl Drop for Handle {
    fn drop(&mut self) {
        // SAFETY: only constructed from a valid CreateFileW handle.
        unsafe { CloseHandle(self.0) };
    }
}

fn open(path: &str, flags: u32) -> Option<Handle> {
    let p = wide(path);
    // Zero desired access: enough for the storage/volume query IOCTLs used here, no admin needed.
    // SAFETY: NUL-terminated path; the handle is closed by `Handle`.
    let h = unsafe { CreateFileW(p.as_ptr(), 0, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, null(), OPEN_EXISTING, flags, null_mut()) };
    (h != INVALID_HANDLE_VALUE).then_some(Handle(h))
}

fn ioctl(h: &Handle, code: u32, input: &[u8], out: &mut [u8]) -> Option<usize> {
    let mut returned = 0u32;
    // SAFETY: buffers and their lengths match; synchronous call (no OVERLAPPED).
    let ok = unsafe {
        DeviceIoControl(h.0, code, input.as_ptr() as *const c_void, input.len() as u32, out.as_mut_ptr().cast(), out.len() as u32, &mut returned, null_mut())
    };
    (ok != 0).then_some(returned as usize)
}

/// `STORAGE_PROPERTY_QUERY { PropertyId, QueryType = PropertyStandardQuery, AdditionalParameters }`.
fn property_query(id: u32) -> [u8; 12] {
    let mut q = [0u8; 12];
    q[..4].copy_from_slice(&id.to_le_bytes());
    q
}

pub fn disks(_notes: &mut Vec<String>) -> Vec<Disk> {
    let mut out = Vec::new();
    for n in 0..32 {
        let Some(h) = open(&format!(r"\\.\PhysicalDrive{n}"), 0) else { continue };
        // STORAGE_DEVICE_DESCRIPTOR: RemovableMedia@10, VendorIdOffset@12, ProductIdOffset@16,
        // ProductRevisionOffset@20, SerialNumberOffset@24, BusType@28.
        let mut d = vec![0u8; 1024];
        let Some(got) = ioctl(&h, IOCTL_STORAGE_QUERY_PROPERTY, &property_query(0), &mut d) else { continue };
        let d = &d[..got];
        let u32_at = |o: usize| d.get(o..o + 4).map(|b| u32::from_le_bytes(b.try_into().unwrap_or_default())).unwrap_or(0) as usize;
        let cstr = |o: usize| -> String {
            if o == 0 || o >= d.len() {
                return String::new();
            }
            let end = d[o..].iter().position(|b| *b == 0).map_or(d.len(), |p| o + p);
            String::from_utf8_lossy(&d[o..end]).trim().to_string()
        };
        let vendor = cstr(u32_at(12));
        let product = cstr(u32_at(16));
        let model = if vendor.is_empty() || product.starts_with(&vendor) { product } else { format!("{vendor} {product}") };
        let bus = match u32_at(28) {
            0x01 => "scsi",
            0x02 => "atapi",
            0x03 => "ata",
            0x04 => "1394",
            0x06 => "fibre",
            0x07 => "usb",
            0x08 => "raid",
            0x09 => "iscsi",
            0x0a => "sas",
            0x0b => "sata",
            0x0c => "sd",
            0x0d => "mmc",
            0x0e => "virtual",
            0x0f => "file-backed",
            0x10 => "storage-spaces",
            0x11 => "nvme",
            0x12 => "scm",
            0x13 => "ufs",
            _ => "unknown",
        };
        // DEVICE_SEEK_PENALTY_DESCRIPTOR: IncursSeekPenalty@8 (StorageDeviceSeekPenaltyProperty = 7).
        let mut sp = [0u8; 12];
        let ssd = ioctl(&h, IOCTL_STORAGE_QUERY_PROPERTY, &property_query(7), &mut sp).map(|_| sp[8] == 0);
        // DISK_GEOMETRY_EX: DISK_GEOMETRY (24 bytes) then DiskSize:i64.
        let mut geo = [0u8; 256];
        let size = ioctl(&h, IOCTL_DISK_GET_DRIVE_GEOMETRY_EX, &[], &mut geo).map_or(0, |_| i64::from_le_bytes(geo[24..32].try_into().unwrap_or_default()) as u64);
        out.push(Disk {
            name: format!("PhysicalDrive{n}"),
            model,
            bus: bus.to_string(),
            ssd,
            size,
            removable: d.get(10).is_some_and(|b| *b != 0),
            serial: Some(cstr(u32_at(24))).filter(|s| !s.is_empty()),
        });
    }
    out
}

pub fn volumes() -> Vec<Volume> {
    // SAFETY: plain bitmask query.
    let mask = unsafe { GetLogicalDrives() };
    let mut out = Vec::new();
    for i in 0..26u32 {
        if mask & (1 << i) == 0 {
            continue;
        }
        let root = format!("{}:\\", char::from(b'A' + i as u8));
        let w = wide(&root);
        // DRIVE_REMOVABLE = 2, DRIVE_FIXED = 3, DRIVE_RAMDISK = 6.
        let kind = unsafe { GetDriveTypeW(w.as_ptr()) };
        if !matches!(kind, 2 | 3 | 6) {
            continue;
        }
        let mut label = [0u16; 261];
        let mut fs = [0u16; 261];
        // SAFETY: buffer lengths passed in characters.
        let ok = unsafe { GetVolumeInformationW(w.as_ptr(), label.as_mut_ptr(), label.len() as u32, null_mut(), null_mut(), null_mut(), fs.as_mut_ptr(), fs.len() as u32) };
        if ok == 0 {
            continue;
        }
        let (mut free, mut total) = (0u64, 0u64);
        // SAFETY: u64 outputs.
        unsafe { GetDiskFreeSpaceExW(w.as_ptr(), &mut free, &mut total, null_mut()) };
        out.push(Volume { mount: root.clone(), file_system: from_wide(&fs), label: from_wide(&label), total, free, dev_drive: dev_drive(&root) });
    }
    out
}

/// `FSCTL_QUERY_PERSISTENT_VOLUME_STATE` with `FILE_FS_PERSISTENT_VOLUME_INFORMATION`
/// {VolumeFlags, FlagMask, Version = 1, Reserved}; Dev Drive is
/// `PERSISTENT_VOLUME_STATE_DEV_VOLUME` (0x2000).
fn dev_drive(root: &str) -> Option<bool> {
    const DEV_VOLUME: u32 = 0x0000_2000;
    let h = open(root, FILE_FLAG_BACKUP_SEMANTICS)?;
    let mut q = [0u8; 16];
    q[4..8].copy_from_slice(&DEV_VOLUME.to_le_bytes());
    q[8..12].copy_from_slice(&1u32.to_le_bytes());
    let mut out = [0u8; 16];
    ioctl(&h, FSCTL_QUERY_PERSISTENT_VOLUME_STATE, &q, &mut out)?;
    Some(u32::from_le_bytes(out[..4].try_into().ok()?) & DEV_VOLUME != 0)
}
