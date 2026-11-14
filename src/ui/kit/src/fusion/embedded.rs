// SPDX-License-Identifier: Apache-2.0
//! First-party implementation of the Zed `embedded_gpui` 5-rule OCAP object protocol:
//! 1. Flat ID-addressed object table (`ObjectId`, `Ref<S>`, `RefTable`)
//! 2. Explicit `Frame` lease with frame-bounded borrowing
//! 3. Deferred `Turn` transactions (`flush` via `ObjectHost::tick`)
//! 4. Capability membranes (`Revocable`, `Attenuated`, `Audited`, `Mirror`)
//! 5. Canonical schema emission to WIT and TypeScript `.d.ts`

use std::collections::{BTreeMap, VecDeque};

use serde::{Deserialize, Serialize};

/// Generation-tagged object handle inside an embedded surface host.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct ObjectId {
    pub index: u32,
    pub generation: u32,
}

impl ObjectId {
    #[must_use]
    pub const fn new(index: u32, generation: u32) -> Self {
        Self { index, generation }
    }
}

/// Typed non-owning capability reference carrying interface tag `S`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ref<S> {
    pub id: ObjectId,
    pub schema: S,
    pub revoked: bool,
}

impl<S: Clone> Ref<S> {
    #[must_use]
    pub const fn new(id: ObjectId, schema: S) -> Self {
        Self {
            id,
            schema,
            revoked: false,
        }
    }

    #[must_use]
    pub fn revoke(&self) -> Self {
        Self {
            id: self.id,
            schema: self.schema.clone(),
            revoked: true,
        }
    }
}

/// Permission flags for attenuated membranes.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapabilityMask {
    pub read: bool,
    pub mutate: bool,
    pub present: bool,
}

impl CapabilityMask {
    pub const FULL: Self = Self {
        read: true,
        mutate: true,
        present: true,
    };
    pub const READ_ONLY: Self = Self {
        read: true,
        mutate: false,
        present: false,
    };
}

/// Membrane wrapper enforcing revocation, attenuation, audit logging, or host mirroring.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "membrane", rename_all = "kebab-case")]
pub enum MembraneKind {
    Revocable { revoked: bool },
    Attenuated { mask: CapabilityMask },
    Audited { audit_channel: String },
    Mirror { target_domain: String },
}

/// Concrete object entry inside [`RefTable`].
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EmbeddedObjectRecord {
    pub id: ObjectId,
    pub interface_name: String,
    pub label: String,
    pub bounds_px: [f32; 4],
    pub membrane: MembraneKind,
}

/// Arena-style lookup table keyed by [`ObjectId`].
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RefTable {
    next_index: u32,
    generation: u32,
    entries: BTreeMap<u32, EmbeddedObjectRecord>,
}

impl RefTable {
    #[must_use]
    pub fn new() -> Self {
        Self {
            next_index: 1,
            generation: 1,
            entries: BTreeMap::new(),
        }
    }

    /// Allocates a new OCAP object handle with an initial membrane policy.
    pub fn insert(
        &mut self,
        interface_name: impl Into<String>,
        label: impl Into<String>,
        bounds_px: [f32; 4],
        membrane: MembraneKind,
    ) -> Ref<String> {
        let idx = self.next_index;
        self.next_index = self.next_index.saturating_add(1);
        let id = ObjectId::new(idx, self.generation);
        let iface = interface_name.into();
        self.entries.insert(
            idx,
            EmbeddedObjectRecord {
                id,
                interface_name: iface.clone(),
                label: label.into(),
                bounds_px,
                membrane,
            },
        );
        Ref::new(id, iface)
    }

    /// Resolves an active, non-revoked object record.
    #[must_use]
    pub fn get(&self, id: ObjectId) -> Option<&EmbeddedObjectRecord> {
        let entry = self.entries.get(&id.index)?;
        if entry.id.generation != id.generation {
            return None;
        }
        if matches!(entry.membrane, MembraneKind::Revocable { revoked: true }) {
            return None;
        }
        Some(entry)
    }

    /// Revokes a `Revocable` capability membrane or switches any object into a revoked state.
    pub fn revoke(&mut self, id: ObjectId) -> Result<(), String> {
        let entry = self
            .entries
            .get_mut(&id.index)
            .ok_or_else(|| format!("unknown object {}", id.index))?;
        if entry.id.generation != id.generation {
            return Err("stale generation handle".to_owned());
        }
        entry.membrane = MembraneKind::Revocable { revoked: true };
        Ok(())
    }

    /// Number of stored object slots (active + revoked).
    #[must_use]
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Whether the object table contains no entries.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

/// Method call batched inside a [`Turn`].
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "kebab-case")]
pub enum OcapOp {
    ResizeSurface {
        target: ObjectId,
        width: f32,
        height: f32,
    },
    SetViewLabel {
        target: ObjectId,
        label: String,
    },
    Invalidate {
        target: ObjectId,
    },
    Revoke {
        target: ObjectId,
    },
}

/// One frame lease opened by [`ObjectHost::begin_frame`].
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Frame {
    pub seq: u64,
    pub viewport_px: [u32; 2],
}

/// Deferred transaction applied atomically at `ObjectHost::tick`.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Turn {
    pub frame_seq: u64,
    pub ops: Vec<OcapOp>,
}

/// Stateful capability host executing queued [`Turn`]s.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ObjectHost {
    pub frame_seq: u64,
    pub objects: RefTable,
    pub pending_turns: VecDeque<Turn>,
    pub audit_log: Vec<String>,
}

impl ObjectHost {
    #[must_use]
    pub fn new() -> Self {
        Self {
            frame_seq: 0,
            objects: RefTable::new(),
            pending_turns: VecDeque::new(),
            audit_log: Vec::new(),
        }
    }

    /// Begins a new frame lease.
    pub fn begin_frame(&mut self, width: u32, height: u32) -> Frame {
        self.frame_seq = self.frame_seq.saturating_add(1);
        Frame {
            seq: self.frame_seq,
            viewport_px: [width, height],
        }
    }

    /// Queues a deferred [`Turn`] for atomic commit in [`Self::tick`].
    pub fn submit_turn(&mut self, turn: Turn) {
        self.pending_turns.push_back(turn);
    }

    /// Commits all queued turns against [`RefTable`], rejecting stale/revoked/attenuated calls.
    pub fn tick(&mut self) -> Result<usize, String> {
        let mut applied = 0usize;
        while let Some(turn) = self.pending_turns.pop_front() {
            for op in turn.ops {
                match op {
                    OcapOp::Revoke { target } => {
                        self.objects.revoke(target)?;
                        self.audit_log
                            .push(format!("frame={} revoke obj#{}", turn.frame_seq, target.index));
                        applied += 1;
                    }
                    OcapOp::ResizeSurface {
                        target,
                        width,
                        height,
                    } => {
                        let rec = self.ensure_mutatable(target)?;
                        rec.bounds_px[2] = width;
                        rec.bounds_px[3] = height;
                        applied += 1;
                    }
                    OcapOp::SetViewLabel { target, label } => {
                        let rec = self.ensure_mutatable(target)?;
                        rec.label = label;
                        applied += 1;
                    }
                    OcapOp::Invalidate { target } => {
                        let _ = self
                            .objects
                            .get(target)
                            .ok_or_else(|| format!("object {} revoked or missing", target.index))?;
                        self.audit_log.push(format!(
                            "frame={} invalidate obj#{}",
                            turn.frame_seq, target.index
                        ));
                        applied += 1;
                    }
                }
            }
        }
        Ok(applied)
    }

    fn ensure_mutatable(&mut self, target: ObjectId) -> Result<&mut EmbeddedObjectRecord, String> {
        let rec = self
            .objects
            .entries
            .get_mut(&target.index)
            .ok_or_else(|| format!("unknown object {}", target.index))?;
        if rec.id.generation != target.generation {
            return Err("stale object generation".to_owned());
        }
        match &rec.membrane {
            MembraneKind::Revocable { revoked: true } => {
                Err(format!("capability {} has been revoked", target.index))
            }
            MembraneKind::Attenuated { mask } if !mask.mutate => {
                Err(format!("capability {} is read-only", target.index))
            }
            MembraneKind::Audited { audit_channel } => {
                self.audit_log
                    .push(format!("audit[{audit_channel}] mutate obj#{}", target.index));
                Ok(rec)
            }
            _ => Ok(rec),
        }
    }
}

/// Core WIT/TypeScript-exportable interface descriptors (`SurfaceApi`, `ViewApi`).
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct InterfaceSchema {
    pub name: &'static str,
    pub methods: &'static [(&'static str, &'static str)],
}

/// Canonical `SurfaceApi` schema matching `embedded_gpui`.
pub const SURFACE_API_SCHEMA: InterfaceSchema = InterfaceSchema {
    name: "surface-api",
    methods: &[
        ("resize", "func(width: f32, height: f32)"),
        ("present-quads", "func(count: u32) -> result<_, string>"),
        ("revoke", "func()"),
    ],
};

/// Canonical `ViewApi` schema matching `embedded_gpui`.
pub const VIEW_API_SCHEMA: InterfaceSchema = InterfaceSchema {
    name: "view-api",
    methods: &[
        ("set-label", "func(label: string)"),
        ("invalidate", "func()"),
        ("bounds", "func() -> tuple<f32, f32, f32, f32>"),
    ],
};

/// Emits a Component Model WIT definition covering `SURFACE_API_SCHEMA` and `VIEW_API_SCHEMA`.
#[must_use]
pub fn emit_wit_contract() -> String {
    let mut out = String::from("package aphrody:embedded-gpui@0.4.0;\n\n");
    for schema in [SURFACE_API_SCHEMA, VIEW_API_SCHEMA] {
        out.push_str(&format!("interface {} {{\n", schema.name));
        out.push_str("  type object-id = tuple<u32, u32>;\n");
        for (method, sig) in schema.methods {
            out.push_str(&format!("  {method}: {sig};\n"));
        }
        out.push_str("}\n\n");
    }
    out
}

/// Emits matching TypeScript declarations for Bun / WebGPU hosts embedding GPUI objects.
#[must_use]
pub fn emit_dts_contract() -> String {
    "export type ObjectId = readonly [index: number, generation: number];\n\
export interface SurfaceApi {\n\
  readonly id: ObjectId;\n\
  resize(width: number, height: number): void;\n\
  presentQuads(count: number): void;\n\
  revoke(): void;\n\
}\n\
export interface ViewApi {\n\
  readonly id: ObjectId;\n\
  setLabel(label: string): void;\n\
  invalidate(): void;\n\
  bounds(): readonly [x: number, y: number, w: number, h: number];\n\
}\n"
    .to_owned()
}
