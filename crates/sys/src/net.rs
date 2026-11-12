use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Interface {
    pub name: String,
    pub loopback: bool,
    /// IP addresses with prefix length (`192.0.2.10/24`).
    pub addresses: Vec<String>,
}

pub fn probe(include_identifiers: bool) -> Vec<Interface> {
    let mut out: Vec<Interface> = Vec::new();
    for ifa in if_addrs::get_if_addrs().unwrap_or_default() {
        let addr = format!("{}/{}", ifa.ip(), prefix_len(&ifa));
        // Public addresses identify the machine; keep them only in local profiles.
        if !include_identifiers && is_public(&ifa.ip()) {
            continue;
        }
        match out.iter_mut().find(|i| i.name == ifa.name) {
            Some(i) => i.addresses.push(addr),
            None => out.push(Interface { name: ifa.name.clone(), loopback: ifa.is_loopback(), addresses: vec![addr] }),
        }
    }
    out
}

fn prefix_len(ifa: &if_addrs::Interface) -> u32 {
    match &ifa.addr {
        if_addrs::IfAddr::V4(v4) => u32::from(v4.netmask).count_ones(),
        if_addrs::IfAddr::V6(v6) => u128::from(v6.netmask).count_ones(),
    }
}

fn is_public(ip: &std::net::IpAddr) -> bool {
    match ip {
        std::net::IpAddr::V4(v4) => !(v4.is_private() || v4.is_loopback() || v4.is_link_local() || v4.octets()[0] == 100 && (v4.octets()[1] & 0xC0) == 64),
        std::net::IpAddr::V6(v6) => {
            let seg = v6.segments()[0];
            !(v6.is_loopback() || (seg & 0xfe00) == 0xfc00 || (seg & 0xffc0) == 0xfe80)
        }
    }
}
