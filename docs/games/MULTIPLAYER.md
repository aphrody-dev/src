# Multiplayer: design note (2026-11-13)

Status: design only. `src/game` has no networking code; the vertical slice is single player. This note fixes the direction so the slice does not block it.

## Constraints

- Browser target: wasm32 and WebGPU, so transports are WebTransport (QUIC datagrams, unreliable) and WebSocket (fallback), never raw UDP.
- Open world, many players per region, 120 fps client at 1080p: the simulation step is fixed and decoupled from rendering.
- Production backends run on `prd` only, the edge (TLS, WebTransport termination, routing) on `fr2`; builds and load tests on `fr1` (`docs/infra/FLEET.md`).

## Model

1. Server-authoritative, fixed tick (30 Hz simulation, snapshots at 15 to 20 Hz). The server owns positions, jumps and world edits; clients send inputs (`Controls` of `src/game/src/controls.rs` is already one struct per frame: movement axis, look, jump, sprint).
2. Client prediction and reconciliation: the client applies inputs locally with the same movement function (`move_player` becomes a pure function shared by client and server), keeps unacknowledged inputs by sequence number, replays them on top of each authoritative snapshot, interpolates other players 100 ms in the past.
3. Terrain is not networked: `noise::height(seed, x, z)` and `build_chunk` are pure and deterministic (tests assert it), so the server sends only the seed. Player edits of the world are small deltas keyed by chunk coordinates.
4. Interest management by chunk: a player receives entities of the 3x3 chunk neighbourhood at full rate and the ring at `VIEW_RADIUS` at low rate. Chunks are the unit of sharding: one process per region, handoff at chunk borders.
5. Wire format: compact binary (varint, quantized positions at 1/64 m, yaw and pitch at 16 bits), one datagram per snapshot under 1200 bytes; reliable stream only for join, chat and world edits.
6. Sync channel for non-realtime state (inventories, shared documents of the Craft Apps): the existing sequenced-op channel of `apps/aphrody-app` (`aphrody-core` `fluid.rs`, `POST /ops`, `GET /events`), see `MERGE-APHRODY.md`.

## Server

A Rust crate (`crates/game-server`, not created yet) reusing `src/game` pure modules (`noise`, `terrain_mesh` heights, the movement function) with Bevy `MinimalPlugins` or plain ECS, packaged as an Alpine image in `infra/docker/` and deployed with `just deploy` on `prd`. Auth reuses the existing account layer; no secret in the client.

## Checks to define before implementation

- Deterministic replay test: the same input log yields the same positions on client and server.
- Network emulation (latency 80 ms, loss 2 percent) run on fr1 with the frame-rate script reporting prediction error.
- Bandwidth budget per player (target under 30 kbit/s down in the open world) asserted by a test on the encoder.
