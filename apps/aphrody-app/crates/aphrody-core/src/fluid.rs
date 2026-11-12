//! Fluid-Framework-style sequenced operations.
//!
//! A [`Sequencer`] assigns a total order (sequence numbers) to operations. A
//! [`Replica`] holds distributed data structures (SharedMap, SharedString,
//! SharedCounter), applies its own operations optimistically, and converges
//! with every other replica once all sequenced operations have been delivered.
//!
//! SharedString uses a simplified merge-tree: segments carry the sequence
//! number and client of their insertion/removal, and each operation is
//! interpreted in the perspective `(ref_seq, client)` of its author.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::{BTreeMap, VecDeque};

pub type ClientId = u64;

/// Sequence number of a locally applied operation that has not been
/// acknowledged by the sequencer yet.
pub const LOCAL_SEQ: u64 = u64::MAX;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum OpBody {
    MapSet { key: String, value: Value },
    MapDelete { key: String },
    MapClear,
    CounterAdd { delta: i64 },
    StringInsert { pos: usize, text: String },
    StringRemove { start: usize, end: usize },
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Op {
    pub client: ClientId,
    pub client_seq: u64,
    pub ref_seq: u64,
    pub channel: String,
    pub body: OpBody,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SequencedOp {
    pub seq: u64,
    /// Minimum sequence number: every known client has seen at least this.
    pub msn: u64,
    pub op: Op,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SeqError {
    Duplicate,
    OutOfOrder { expected: u64 },
    BadRefSeq,
}

impl core::fmt::Display for SeqError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            SeqError::Duplicate => write!(f, "duplicate client sequence number"),
            SeqError::OutOfOrder { expected } => write!(f, "client sequence out of order, expected {expected}"),
            SeqError::BadRefSeq => write!(f, "ref_seq is ahead of the sequencer"),
        }
    }
}

impl std::error::Error for SeqError {}

/// Total-order ordering service. Idempotent per `(client, client_seq)`.
#[derive(Default, Debug)]
pub struct Sequencer {
    log: Vec<SequencedOp>,
    last_client_seq: BTreeMap<ClientId, u64>,
    client_ref: BTreeMap<ClientId, u64>,
}

impl Sequencer {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn last_seq(&self) -> u64 {
        self.log.len() as u64
    }

    pub fn submit(&mut self, op: Op) -> Result<SequencedOp, SeqError> {
        let last = self.last_client_seq.get(&op.client).copied().unwrap_or(0);
        if op.client_seq <= last {
            return Err(SeqError::Duplicate);
        }
        if op.client_seq != last + 1 {
            return Err(SeqError::OutOfOrder { expected: last + 1 });
        }
        if op.ref_seq > self.last_seq() {
            return Err(SeqError::BadRefSeq);
        }
        self.last_client_seq.insert(op.client, op.client_seq);
        self.client_ref.insert(op.client, op.ref_seq);
        let msn = self.client_ref.values().copied().min().unwrap_or(0);
        let s = SequencedOp { seq: self.last_seq() + 1, msn, op };
        self.log.push(s.clone());
        Ok(s)
    }

    /// All operations with `seq > after`.
    pub fn since(&self, after: u64) -> &[SequencedOp] {
        &self.log[(after as usize).min(self.log.len())..]
    }
}

// ---------------------------------------------------------------- SharedMap

#[derive(Default, Clone, Debug)]
pub struct SharedMap {
    data: BTreeMap<String, Value>,
    pending_keys: BTreeMap<String, u32>,
    pending_clear: u32,
}

impl SharedMap {
    pub fn get(&self, k: &str) -> Option<&Value> {
        self.data.get(k)
    }
    pub fn len(&self) -> usize {
        self.data.len()
    }
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }
    pub fn to_json(&self) -> Value {
        Value::Object(self.data.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
    }

    fn apply_local(&mut self, body: &OpBody) {
        match body {
            OpBody::MapSet { key, value } => {
                self.data.insert(key.clone(), value.clone());
                *self.pending_keys.entry(key.clone()).or_default() += 1;
            }
            OpBody::MapDelete { key } => {
                self.data.remove(key);
                *self.pending_keys.entry(key.clone()).or_default() += 1;
            }
            OpBody::MapClear => {
                self.data.clear();
                self.pending_clear += 1;
            }
            _ => {}
        }
    }

    fn apply_remote(&mut self, body: &OpBody) {
        match body {
            OpBody::MapSet { key, value } => {
                if self.pending_clear == 0 && !self.pending_keys.contains_key(key) {
                    self.data.insert(key.clone(), value.clone());
                }
            }
            OpBody::MapDelete { key } => {
                if self.pending_clear == 0 && !self.pending_keys.contains_key(key) {
                    self.data.remove(key);
                }
            }
            OpBody::MapClear => {
                let keep: BTreeMap<String, Value> = self
                    .data
                    .iter()
                    .filter(|(k, _)| self.pending_keys.contains_key(*k))
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect();
                self.data = keep;
            }
            _ => {}
        }
    }

    fn ack(&mut self, body: &OpBody) {
        match body {
            OpBody::MapSet { key, .. } | OpBody::MapDelete { key } => {
                if let Some(c) = self.pending_keys.get_mut(key) {
                    *c -= 1;
                    if *c == 0 {
                        self.pending_keys.remove(key);
                    }
                }
            }
            OpBody::MapClear => self.pending_clear = self.pending_clear.saturating_sub(1),
            _ => {}
        }
    }
}

// ------------------------------------------------------------ SharedCounter

#[derive(Default, Clone, Debug)]
pub struct SharedCounter {
    value: i64,
}

impl SharedCounter {
    pub fn value(&self) -> i64 {
        self.value
    }
}

// ------------------------------------------------------------- SharedString

#[derive(Clone, Debug)]
struct Removal {
    seq: u64,
    client: ClientId,
    cseq: u64,
}

#[derive(Clone, Debug)]
struct Segment {
    text: Vec<char>,
    ins_seq: u64,
    ins_client: ClientId,
    ins_cseq: u64,
    removals: Vec<Removal>,
}

impl Segment {
    fn len_in(&self, ref_seq: u64, client: ClientId) -> usize {
        let inserted = self.ins_seq <= ref_seq || self.ins_client == client;
        let removed = self.removals.iter().any(|r| r.seq <= ref_seq || r.client == client);
        if inserted && !removed { self.text.len() } else { 0 }
    }
    fn split(&mut self, at: usize) -> Segment {
        let tail = self.text.split_off(at);
        Segment {
            text: tail,
            ins_seq: self.ins_seq,
            ins_client: self.ins_client,
            ins_cseq: self.ins_cseq,
            removals: self.removals.clone(),
        }
    }
}

#[derive(Default, Clone, Debug)]
pub struct SharedString {
    segs: Vec<Segment>,
}

impl SharedString {
    pub fn text(&self) -> String {
        self.segs.iter().filter(|s| s.removals.is_empty()).flat_map(|s| s.text.iter()).collect()
    }

    pub fn len(&self) -> usize {
        self.segs.iter().filter(|s| s.removals.is_empty()).map(|s| s.text.len()).sum()
    }

    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    fn insert(&mut self, pos: usize, text: &str, ref_seq: u64, client: ClientId, seq: u64, cseq: u64) {
        let new_seg = Segment {
            text: text.chars().collect(),
            ins_seq: seq,
            ins_client: client,
            ins_cseq: cseq,
            removals: Vec::new(),
        };
        if new_seg.text.is_empty() {
            return;
        }
        let mut remaining = pos;
        let mut i = 0;
        while i < self.segs.len() {
            let l = self.segs[i].len_in(ref_seq, client);
            if l > 0 {
                if remaining < l {
                    if remaining > 0 {
                        let tail = self.segs[i].split(remaining);
                        self.segs.insert(i + 1, tail);
                        i += 1;
                    }
                    break;
                }
                remaining -= l;
            } else if remaining == 0 {
                let s = &self.segs[i];
                // Insert immediately after the pos-th visible character, in front
                // of any zero-length segment (tombstone or concurrent insert). The
                // only exception is another client's pending segment as seen by
                // us: it will be sequenced after the incoming op, so it is newer
                // and must stay in front.
                if !(s.ins_seq == LOCAL_SEQ && s.ins_client != client) {
                    break;
                }
            }
            i += 1;
        }
        self.segs.insert(i, new_seg);
    }

    fn remove(&mut self, start: usize, end: usize, ref_seq: u64, client: ClientId, seq: u64, cseq: u64) {
        if start >= end {
            return;
        }
        let mut pos = 0usize;
        let mut i = 0usize;
        while i < self.segs.len() && pos < end {
            let l = self.segs[i].len_in(ref_seq, client);
            if l == 0 {
                i += 1;
                continue;
            }
            let (s_start, s_end) = (pos, pos + l);
            if s_end <= start {
                pos = s_end;
                i += 1;
                continue;
            }
            let from = start.max(s_start) - s_start;
            let to = end.min(s_end) - s_start;
            if to < l {
                let tail = self.segs[i].split(to);
                self.segs.insert(i + 1, tail);
            }
            let mut target = i;
            if from > 0 {
                let tail = self.segs[i].split(from);
                self.segs.insert(i + 1, tail);
                target = i + 1;
            }
            self.segs[target].removals.push(Removal { seq, client, cseq });
            pos = s_end;
            i = target + 1;
        }
    }

    fn ack(&mut self, client: ClientId, cseq: u64, seq: u64) {
        for s in &mut self.segs {
            if s.ins_seq == LOCAL_SEQ && s.ins_client == client && s.ins_cseq == cseq {
                s.ins_seq = seq;
            }
            for r in &mut s.removals {
                if r.seq == LOCAL_SEQ && r.client == client && r.cseq == cseq {
                    r.seq = seq;
                }
            }
        }
    }
}

// ------------------------------------------------------------------ Replica

#[derive(Debug, PartialEq, Eq)]
pub enum ApplyError {
    Gap { expected: u64, got: u64 },
    AckMismatch,
}

impl core::fmt::Display for ApplyError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            ApplyError::Gap { expected, got } => write!(f, "sequence gap: expected {expected}, got {got}"),
            ApplyError::AckMismatch => write!(f, "acknowledgement does not match the oldest pending op"),
        }
    }
}

impl std::error::Error for ApplyError {}

#[derive(Debug)]
pub struct Replica {
    pub client: ClientId,
    last_seq: u64,
    next_cseq: u64,
    pending: VecDeque<(u64, String, OpBody)>,
    maps: BTreeMap<String, SharedMap>,
    strings: BTreeMap<String, SharedString>,
    counters: BTreeMap<String, SharedCounter>,
}

impl Replica {
    pub fn new(client: ClientId) -> Self {
        Replica {
            client,
            last_seq: 0,
            next_cseq: 1,
            pending: VecDeque::new(),
            maps: BTreeMap::new(),
            strings: BTreeMap::new(),
            counters: BTreeMap::new(),
        }
    }

    pub fn last_seq(&self) -> u64 {
        self.last_seq
    }
    pub fn pending_len(&self) -> usize {
        self.pending.len()
    }
    pub fn map(&self, ch: &str) -> Option<&SharedMap> {
        self.maps.get(ch)
    }
    pub fn string(&self, ch: &str) -> Option<&SharedString> {
        self.strings.get(ch)
    }
    pub fn counter(&self, ch: &str) -> i64 {
        self.counters.get(ch).map_or(0, |c| c.value)
    }

    fn local(&mut self, channel: &str, mut body: OpBody) -> Op {
        // Clamp string positions so the wire op carries exactly what was applied.
        let slen = self.strings.get(channel).map_or(0, |s| s.len());
        match &mut body {
            OpBody::StringInsert { pos, .. } => *pos = (*pos).min(slen),
            OpBody::StringRemove { start, end } => {
                *end = (*end).min(slen);
                *start = (*start).min(*end);
            }
            _ => {}
        }
        let cseq = self.next_cseq;
        self.next_cseq += 1;
        match &body {
            OpBody::MapSet { .. } | OpBody::MapDelete { .. } | OpBody::MapClear => {
                self.maps.entry(channel.to_string()).or_default().apply_local(&body)
            }
            OpBody::CounterAdd { delta } => {
                self.counters.entry(channel.to_string()).or_default().value += delta
            }
            OpBody::StringInsert { pos, text } => {
                let (rs, me) = (self.last_seq, self.client);
                let s = self.strings.entry(channel.to_string()).or_default();
                let pos = (*pos).min(s.len());
                s.insert(pos, text, rs, me, LOCAL_SEQ, cseq);
            }
            OpBody::StringRemove { start, end } => {
                let (rs, me) = (self.last_seq, self.client);
                let s = self.strings.entry(channel.to_string()).or_default();
                let end = (*end).min(s.len());
                s.remove(*start, end, rs, me, LOCAL_SEQ, cseq);
            }
        }
        self.pending.push_back((cseq, channel.to_string(), body.clone()));
        Op { client: self.client, client_seq: cseq, ref_seq: self.last_seq, channel: channel.to_string(), body }
    }

    pub fn map_set(&mut self, ch: &str, key: &str, value: Value) -> Op {
        self.local(ch, OpBody::MapSet { key: key.to_string(), value })
    }
    pub fn map_delete(&mut self, ch: &str, key: &str) -> Op {
        self.local(ch, OpBody::MapDelete { key: key.to_string() })
    }
    pub fn map_clear(&mut self, ch: &str) -> Op {
        self.local(ch, OpBody::MapClear)
    }
    pub fn counter_add(&mut self, ch: &str, delta: i64) -> Op {
        self.local(ch, OpBody::CounterAdd { delta })
    }
    pub fn string_insert(&mut self, ch: &str, pos: usize, text: &str) -> Op {
        self.local(ch, OpBody::StringInsert { pos, text: text.to_string() })
    }
    pub fn string_remove(&mut self, ch: &str, start: usize, end: usize) -> Op {
        self.local(ch, OpBody::StringRemove { start, end })
    }

    /// Process the next sequenced op. Must be called with consecutive seq numbers.
    pub fn process(&mut self, sop: &SequencedOp) -> Result<(), ApplyError> {
        if sop.seq != self.last_seq + 1 {
            return Err(ApplyError::Gap { expected: self.last_seq + 1, got: sop.seq });
        }
        let op = &sop.op;
        if op.client == self.client {
            let Some((cseq, ch, body)) = self.pending.pop_front() else { return Err(ApplyError::AckMismatch) };
            if cseq != op.client_seq || ch != op.channel {
                self.pending.push_front((cseq, ch, body));
                return Err(ApplyError::AckMismatch);
            }
            match &body {
                OpBody::MapSet { .. } | OpBody::MapDelete { .. } | OpBody::MapClear => {
                    if let Some(m) = self.maps.get_mut(&ch) {
                        m.ack(&body)
                    }
                }
                OpBody::StringInsert { .. } | OpBody::StringRemove { .. } => {
                    if let Some(s) = self.strings.get_mut(&ch) {
                        s.ack(self.client, cseq, sop.seq)
                    }
                }
                OpBody::CounterAdd { .. } => {}
            }
        } else {
            match &op.body {
                b @ (OpBody::MapSet { .. } | OpBody::MapDelete { .. } | OpBody::MapClear) => {
                    self.maps.entry(op.channel.clone()).or_default().apply_remote(b)
                }
                OpBody::CounterAdd { delta } => {
                    self.counters.entry(op.channel.clone()).or_default().value += delta
                }
                OpBody::StringInsert { pos, text } => self
                    .strings
                    .entry(op.channel.clone())
                    .or_default()
                    .insert(*pos, text, op.ref_seq, op.client, sop.seq, op.client_seq),
                OpBody::StringRemove { start, end } => self
                    .strings
                    .entry(op.channel.clone())
                    .or_default()
                    .remove(*start, *end, op.ref_seq, op.client, sop.seq, op.client_seq),
            }
        }
        self.last_seq = sop.seq;
        Ok(())
    }

    /// Deterministic JSON view used for convergence checks and UI.
    pub fn snapshot(&self) -> Value {
        json!({
            "maps": self.maps.iter().map(|(k, v)| (k.clone(), v.to_json())).collect::<serde_json::Map<_, _>>(),
            "strings": self.strings.iter().map(|(k, v)| (k.clone(), Value::String(v.text()))).collect::<serde_json::Map<_, _>>(),
            "counters": self.counters.iter().map(|(k, v)| (k.clone(), json!(v.value))).collect::<serde_json::Map<_, _>>(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Net {
        seq: Sequencer,
        reps: Vec<Replica>,
        delivered: Vec<usize>,
    }

    impl Net {
        fn new(n: usize) -> Net {
            Net { seq: Sequencer::new(), reps: (0..n).map(|i| Replica::new(i as u64 + 1)).collect(), delivered: vec![0; n] }
        }
        fn submit(&mut self, op: Op) {
            self.seq.submit(op).unwrap();
        }
        fn deliver(&mut self, r: usize, max: usize) {
            for _ in 0..max {
                let log = self.seq.since(self.delivered[r] as u64);
                let Some(op) = log.first().cloned() else { return };
                self.reps[r].process(&op).unwrap();
                self.delivered[r] += 1;
            }
        }
        fn flush(&mut self) {
            for r in 0..self.reps.len() {
                self.deliver(r, usize::MAX);
            }
        }
        fn assert_converged(&self) {
            let first = self.reps[0].snapshot();
            for r in &self.reps[1..] {
                assert_eq!(r.snapshot(), first, "client {}", r.client);
                assert_eq!(r.pending_len(), 0);
            }
        }
    }

    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self, m: usize) -> usize {
            self.0 = self.0.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            ((self.0 >> 33) as usize) % m.max(1)
        }
    }

    #[test]
    fn sequencer_is_total_ordered_and_idempotent() {
        let mut s = Sequencer::new();
        let mut a = Replica::new(1);
        let op = a.counter_add("c", 1);
        let first = s.submit(op.clone()).unwrap();
        assert_eq!(first.seq, 1);
        assert_eq!(s.submit(op), Err(SeqError::Duplicate));
        let mut gap = a.counter_add("c", 1);
        gap.client_seq = 5;
        assert_eq!(s.submit(gap), Err(SeqError::OutOfOrder { expected: 2 }));
        let mut bad = a.counter_add("c", 1);
        bad.client_seq = 2;
        bad.ref_seq = 99;
        assert_eq!(s.submit(bad), Err(SeqError::BadRefSeq));
    }

    #[test]
    fn counter_converges() {
        let mut n = Net::new(3);
        let ops: Vec<Op> = (0..3).map(|i| n.reps[i].counter_add("hits", (i as i64 + 1) * 10)).collect();
        for o in ops {
            n.submit(o);
        }
        n.flush();
        n.assert_converged();
        assert_eq!(n.reps[2].counter("hits"), 60);
    }

    #[test]
    fn map_last_writer_wins_by_sequence() {
        let mut n = Net::new(2);
        let a = n.reps[0].map_set("m", "k", json!("from-a"));
        let b = n.reps[1].map_set("m", "k", json!("from-b"));
        // Replica 0 sees its own optimistic value, replica 1 its own.
        assert_eq!(n.reps[0].map("m").unwrap().get("k"), Some(&json!("from-a")));
        n.submit(b);
        n.submit(a);
        n.flush();
        n.assert_converged();
        assert_eq!(n.reps[0].map("m").unwrap().get("k"), Some(&json!("from-a")), "a was sequenced last");
    }

    #[test]
    fn map_clear_and_delete() {
        let mut n = Net::new(2);
        let o1 = n.reps[0].map_set("m", "x", json!(1));
        n.submit(o1);
        n.flush();
        let c = n.reps[0].map_clear("m");
        let s = n.reps[1].map_set("m", "y", json!(2));
        n.submit(c);
        n.submit(s);
        n.flush();
        n.assert_converged();
        let m = n.reps[0].map("m").unwrap();
        assert_eq!((m.get("x"), m.get("y")), (None, Some(&json!(2))));
        let d = n.reps[1].map_delete("m", "y");
        n.submit(d);
        n.flush();
        assert!(n.reps[0].map("m").unwrap().is_empty());
    }

    #[test]
    fn string_concurrent_inserts_converge() {
        let mut n = Net::new(2);
        let o = n.reps[0].string_insert("s", 0, "hello");
        n.submit(o);
        n.flush();
        let a = n.reps[0].string_insert("s", 5, " world");
        let b = n.reps[1].string_insert("s", 5, "!!");
        n.submit(a);
        n.submit(b);
        n.flush();
        n.assert_converged();
        assert_eq!(n.reps[0].string("s").unwrap().text(), "hello!! world");
    }

    #[test]
    fn string_insert_inside_concurrent_remove() {
        let mut n = Net::new(2);
        let o = n.reps[0].string_insert("s", 0, "abcdef");
        n.submit(o);
        n.flush();
        let rm = n.reps[0].string_remove("s", 1, 5);
        let ins = n.reps[1].string_insert("s", 3, "XY");
        n.submit(rm);
        n.submit(ins);
        n.flush();
        n.assert_converged();
        assert_eq!(n.reps[1].string("s").unwrap().text(), "aXYf");
    }

    #[test]
    fn randomized_convergence() {
        for seed in 1..=40u64 {
            let mut rng = Lcg(seed * 7919);
            let mut n = Net::new(4);
            for _ in 0..250 {
                let r = rng.next(4);
                if rng.next(3) == 0 {
                    n.deliver(r, 1 + rng.next(4));
                    continue;
                }
                let op = match rng.next(7) {
                    0 => n.reps[r].map_set("m", &format!("k{}", rng.next(4)), json!(rng.next(100))),
                    1 => n.reps[r].map_delete("m", &format!("k{}", rng.next(4))),
                    2 => n.reps[r].counter_add("c", rng.next(9) as i64 - 4),
                    3 | 4 => {
                        let len = n.reps[r].string("s").map_or(0, |s| s.len());
                        let t = ["a", "bc", "def", "XYZW"][rng.next(4)];
                        n.reps[r].string_insert("s", rng.next(len + 1), t)
                    }
                    5 => {
                        let len = n.reps[r].string("s").map_or(0, |s| s.len());
                        let a = rng.next(len + 1);
                        let b = (a + rng.next(4)).min(len);
                        n.reps[r].string_remove("s", a, b)
                    }
                    _ => {
                        if rng.next(8) == 0 {
                            n.reps[r].map_clear("m")
                        } else {
                            n.reps[r].counter_add("c", 1)
                        }
                    }
                };
                n.submit(op);
            }
            n.flush();
            n.assert_converged();
        }
    }


    #[test]
    fn small_string_scenarios_converge() {
        for ops_n in 2..10usize {
          for seed in 1..1500u64 {
            let mut rng = Lcg(seed * 104729);
            let mut n = Net::new(2);
            let mut log = Vec::new();
            for _ in 0..ops_n {
                let r = rng.next(2);
                if rng.next(3) == 0 { n.deliver(r, 1 + rng.next(2)); log.push(format!("deliver {r}")); continue; }
                let len = n.reps[r].string("s").map_or(0, |s| s.len());
                let op = if rng.next(3) == 0 {
                    let a = rng.next(len + 1); let b = (a + rng.next(3)).min(len);
                    n.reps[r].string_remove("s", a, b)
                } else {
                    let t = ["a", "bc", "def"][rng.next(3)];
                    n.reps[r].string_insert("s", rng.next(len + 1), t)
                };
                log.push(format!("r{r} {:?} ref{} cs{}", op.body, op.ref_seq, op.client_seq));
                n.submit(op);
            }
            n.flush();
            if n.reps[0].snapshot() != n.reps[1].snapshot() {
                panic!("seed {seed}\n{}\n{:?}\n{:?}", log.join("\n"), n.reps[0].snapshot(), n.reps[1].snapshot());
            }
          }
        }
    }
    #[test]
    fn rejects_gaps() {
        let mut a = Replica::new(1);
        let mut s = Sequencer::new();
        let o = Replica::new(2).counter_add("c", 1);
        s.submit(o.clone()).unwrap();
        let mut o2 = o;
        o2.client_seq = 2;
        let second = s.submit(o2).unwrap();
        assert_eq!(a.process(&second), Err(ApplyError::Gap { expected: 1, got: 2 }));
    }
}
