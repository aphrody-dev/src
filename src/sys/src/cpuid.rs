//! Direct CPUID decoding (Intel SDM vol. 2A, AMD APM vol. 3, Hyper-V TLFS). x86/x86_64 only.

use serde::Serialize;

#[derive(Debug, Default, Serialize)]
pub struct CpuId {
    pub vendor: String,
    pub brand: String,
    pub family: u32,
    pub model: u32,
    pub stepping: u32,
    /// Intel hybrid architecture flag (CPUID.07H:EDX[15]).
    pub hybrid: bool,
    pub caches: Vec<Cache>,
    pub hypervisor: Option<Hypervisor>,
}

#[derive(Debug, Serialize)]
pub struct Cache {
    pub level: u32,
    /// `data`, `instruction` or `unified`.
    pub kind: &'static str,
    pub size_bytes: u64,
    pub ways: u32,
    pub line_bytes: u32,
    /// Logical processors sharing one instance of this cache.
    pub shared_by: u32,
}

#[derive(Debug, Serialize)]
pub struct Hypervisor {
    /// Raw 12-byte vendor signature from CPUID.40000000H (e.g. `Microsoft Hv`, `KVMKVMKVM`).
    pub signature: String,
    /// Normalized name (`hyperv`, `kvm`, `vmware`, `xen`, `qemu-tcg`, `virtualbox`, ...).
    pub name: &'static str,
    /// Hyper-V only: this partition holds the CreatePartitions privilege, i.e. it is the root
    /// (host) partition of a Windows machine running Hyper-V/VBS, not a guest VM.
    pub root_partition: bool,
}

#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
pub fn read() -> Option<CpuId> {
    #[cfg(target_arch = "x86")]
    use std::arch::x86::{__cpuid_count, CpuidResult};
    #[cfg(target_arch = "x86_64")]
    use std::arch::x86_64::{__cpuid_count, CpuidResult};

    // CPUID is unconditionally available on every x86_64 CPU and on every i586+ that Rust targets.
    let q = |leaf: u32, sub: u32| -> CpuidResult { __cpuid_count(leaf, sub) };
    let regs = |r: [u32; 3]| -> String {
        let bytes: Vec<u8> = r.iter().flat_map(|x| x.to_le_bytes()).collect();
        String::from_utf8_lossy(&bytes).trim_matches(char::from(0)).trim().to_string()
    };

    let l0 = q(0, 0);
    let max = l0.eax;
    let vendor = regs([l0.ebx, l0.edx, l0.ecx]);
    let ext_max = q(0x8000_0000, 0).eax;

    let brand = if ext_max >= 0x8000_0004 {
        let mut b = Vec::new();
        for leaf in 0x8000_0002..=0x8000_0004u32 {
            let r = q(leaf, 0);
            for x in [r.eax, r.ebx, r.ecx, r.edx] {
                b.extend_from_slice(&x.to_le_bytes());
            }
        }
        String::from_utf8_lossy(&b).trim_matches(char::from(0)).trim().to_string()
    } else {
        String::new()
    };

    let l1 = q(1, 0);
    let base_family = (l1.eax >> 8) & 0xf;
    let base_model = (l1.eax >> 4) & 0xf;
    let family = if base_family == 0xf { base_family + ((l1.eax >> 20) & 0xff) } else { base_family };
    let model = if base_family == 0x6 || base_family == 0xf { base_model | (((l1.eax >> 16) & 0xf) << 4) } else { base_model };

    let hybrid = max >= 7 && (q(7, 0).edx >> 15) & 1 == 1;

    // Deterministic cache parameters: leaf 4 (Intel) or 8000_001D (AMD, same layout).
    let cache_leaf = if vendor == "AuthenticAMD" || vendor == "HygonGenuine" {
        (ext_max >= 0x8000_001d).then_some(0x8000_001d)
    } else {
        (max >= 4).then_some(4)
    };
    let mut caches = Vec::new();
    if let Some(leaf) = cache_leaf {
        for sub in 0..16 {
            let r = q(leaf, sub);
            let kind = match r.eax & 0x1f {
                1 => "data",
                2 => "instruction",
                3 => "unified",
                _ => break,
            };
            let ways = ((r.ebx >> 22) & 0x3ff) + 1;
            let partitions = ((r.ebx >> 12) & 0x3ff) + 1;
            let line = (r.ebx & 0xfff) + 1;
            let sets = r.ecx + 1;
            caches.push(Cache {
                level: (r.eax >> 5) & 0x7,
                kind,
                size_bytes: u64::from(ways) * u64::from(partitions) * u64::from(line) * u64::from(sets),
                ways,
                line_bytes: line,
                shared_by: ((r.eax >> 14) & 0xfff) + 1,
            });
        }
    }

    // CPUID.01H:ECX[31] is reserved for hypervisors; leaf 4000_0000 carries the vendor.
    let hypervisor = ((l1.ecx >> 31) & 1 == 1).then(|| {
        let h = q(0x4000_0000, 0);
        let signature = regs([h.ebx, h.ecx, h.edx]);
        let name = hypervisor_name(&signature);
        // Hyper-V TLFS: CPUID.40000003H:EBX[0] = CreatePartitions, granted only to the root.
        let root_partition = name == "hyperv" && h.eax >= 0x4000_0003 && q(0x4000_0003, 0).ebx & 1 == 1;
        Hypervisor { signature, name, root_partition }
    });

    Some(CpuId { vendor, brand, family, model, stepping: l1.eax & 0xf, hybrid, caches, hypervisor })
}

#[cfg(not(any(target_arch = "x86", target_arch = "x86_64")))]
pub fn read() -> Option<CpuId> {
    None
}

/// Signatures as matched by systemd's `detect_vm_cpuid()`.
pub fn hypervisor_name(sig: &str) -> &'static str {
    match sig {
        "Microsoft Hv" => "hyperv",
        "KVMKVMKVM" => "kvm",
        "Linux KVM Hv" => "kvm",
        "VMwareVMware" => "vmware",
        "XenVMMXenVMM" => "xen",
        "TCGTCGTCGTCG" => "qemu-tcg",
        "VBoxVBoxVBox" => "virtualbox",
        "bhyve bhyve" => "bhyve",
        "QNXQVMBSQG" => "qnx",
        "ACRNACRNACRN" => "acrn",
        "SRESRESRESRE" => "sre",
        "Apple VZ" => "apple",
        s if s.contains("prl hyperv") || s.contains("lrpepyh") => "parallels",
        _ => "unknown",
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn reads_this_cpu() {
        if let Some(c) = super::read() {
            assert!(!c.vendor.is_empty());
            assert!(c.family > 0);
            assert!(c.caches.iter().any(|k| k.level >= 1 && k.size_bytes > 0));
        }
    }

    #[test]
    fn names_hypervisors() {
        assert_eq!(super::hypervisor_name("Microsoft Hv"), "hyperv");
        assert_eq!(super::hypervisor_name("KVMKVMKVM"), "kvm");
        assert_eq!(super::hypervisor_name("nope"), "unknown");
    }
}
