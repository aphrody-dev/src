//! Commands as data: every step is planned as a list of [`Cmd`], then run by a [`Runner`]. Tests and
//! `--dry-run` use a recording runner; nothing in plan code spawns processes.

use std::fmt;
use std::path::PathBuf;
use std::process::{Command, Stdio};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Cmd {
    pub program: String,
    pub args: Vec<String>,
    pub cwd: Option<PathBuf>,
    pub env: Vec<(String, String)>,
    /// Run under `nice -n <n>` (heavy steps on a shared host).
    pub nice: Option<i32>,
}

impl Cmd {
    pub fn new(program: impl Into<String>) -> Self {
        Self { program: program.into(), args: Vec::new(), cwd: None, env: Vec::new(), nice: None }
    }
    pub fn arg(mut self, a: impl Into<String>) -> Self {
        self.args.push(a.into());
        self
    }
    pub fn args<I: IntoIterator<Item = S>, S: Into<String>>(mut self, it: I) -> Self {
        self.args.extend(it.into_iter().map(Into::into));
        self
    }
    pub fn cwd(mut self, p: impl Into<PathBuf>) -> Self {
        self.cwd = Some(p.into());
        self
    }
    pub fn env(mut self, k: &str, v: impl Into<String>) -> Self {
        self.env.push((k.into(), v.into()));
        self
    }
    pub fn nice(mut self, n: i32) -> Self {
        self.nice = Some(n);
        self
    }

    fn command(&self) -> Command {
        let mut c = match self.nice {
            Some(n) => {
                let mut c = Command::new("nice");
                c.arg("-n").arg(n.to_string()).arg(&self.program);
                c
            }
            None => Command::new(&self.program),
        };
        c.args(&self.args);
        if let Some(d) = &self.cwd {
            c.current_dir(d);
        }
        for (k, v) in &self.env {
            c.env(k, v);
        }
        c
    }
}

impl fmt::Display for Cmd {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(d) = &self.cwd {
            write!(f, "(cd {}) ", d.display())?;
        }
        for (k, v) in &self.env {
            write!(f, "{k}={v} ")?;
        }
        if let Some(n) = self.nice {
            write!(f, "nice -n {n} ")?;
        }
        write!(f, "{}", self.program)?;
        for a in &self.args {
            if a.contains([' ', '"', '\'']) { write!(f, " '{a}'")? } else { write!(f, " {a}")? }
        }
        Ok(())
    }
}

pub trait Runner {
    /// Run with inherited stdio; error on non-zero exit.
    fn run(&mut self, c: &Cmd) -> Result<(), String>;
    /// Run and capture stdout; error on non-zero exit.
    fn output(&mut self, c: &Cmd) -> Result<String, String>;
    fn dry(&self) -> bool {
        false
    }
}

pub struct Real;

impl Runner for Real {
    fn run(&mut self, c: &Cmd) -> Result<(), String> {
        eprintln!("+ {c}");
        let st = c.command().status().map_err(|e| format!("{}: {e}", c.program))?;
        if st.success() { Ok(()) } else { Err(format!("`{c}` failed: {st}")) }
    }
    fn output(&mut self, c: &Cmd) -> Result<String, String> {
        let o = c
            .command()
            .stdin(Stdio::null())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| format!("{}: {e}", c.program))?;
        if o.status.success() {
            Ok(String::from_utf8_lossy(&o.stdout).into_owned())
        } else {
            Err(format!("`{c}` failed: {} {}", o.status, String::from_utf8_lossy(&o.stderr).trim()))
        }
    }
}

/// Records commands instead of running them (`--dry-run`, tests). `output` answers from `replies`
/// (first program match) or returns an empty string.
#[derive(Default)]
pub struct Record {
    pub cmds: Vec<Cmd>,
    pub replies: Vec<(String, String)>,
}

impl Runner for Record {
    fn run(&mut self, c: &Cmd) -> Result<(), String> {
        println!("[dry-run] {c}");
        self.cmds.push(c.clone());
        Ok(())
    }
    fn output(&mut self, c: &Cmd) -> Result<String, String> {
        self.cmds.push(c.clone());
        Ok(self.replies.iter().find(|(p, _)| c.program.ends_with(p.as_str())).map(|r| r.1.clone()).unwrap_or_default())
    }
    fn dry(&self) -> bool {
        true
    }
}
