//! Pass-through rustc wrapper for Windows: when the command line would exceed the
//! CreateProcess limit (web-sys carries a huge --check-cfg list) the arguments are
//! moved into a rustc @argfile. Usage: RUSTC_WRAPPER=<this exe> cargo build ...
use std::process::{Command, exit};

fn main() {
    let mut args = std::env::args().skip(1);
    let Some(rustc) = args.next() else { exit(2) };
    let rest: Vec<String> = args.collect();
    let total: usize = rest.iter().map(|a| a.len() + 3).sum();
    let mut cmd = Command::new(&rustc);
    if total > 24000 && !rest.iter().any(|a| a.contains('\n')) {
        let path = std::env::temp_dir().join(format!("rustc-argfile-{}.txt", std::process::id()));
        std::fs::write(&path, rest.join("\n")).expect("write argfile");
        cmd.arg(format!("@{}", path.display()));
        let st = cmd.status().expect("spawn rustc");
        let _ = std::fs::remove_file(&path);
        exit(st.code().unwrap_or(1));
    }
    cmd.args(&rest);
    exit(cmd.status().expect("spawn rustc").code().unwrap_or(1));
}
