// SPDX-License-Identifier: Apache-2.0
//! Pure-Rust Sovereign Game Backend & Bevy Fullstack Bridge.
//!
//! Exposes Axum 0.8 REST / Frame-Sync endpoints connecting UE5-migrated
//! asset bundles (`corelib::epic`) and deterministic 60 FPS clock simulation.

use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use corelib::{
    ArcSysCelMaterial, BevyMigratedEntity, BevySceneBundle, BevyTransform, InputState,
    SimulationClock,
};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Shared state for the sovereign game backend
#[derive(Clone)]
pub struct GameServerState {
    pub clock: Arc<Mutex<SimulationClock>>,
    pub p1_input: Arc<Mutex<InputState>>,
    pub p2_input: Arc<Mutex<InputState>>,
}

impl Default for GameServerState {
    fn default() -> Self {
        Self {
            clock: Arc::new(Mutex::new(SimulationClock::new(60))),
            p1_input: Arc::new(Mutex::new(InputState::default())),
            p2_input: Arc::new(Mutex::new(InputState::default())),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct SceneQuery {
    pub character: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FrameTickRequest {
    pub p1_buttons_mask: u32,
    pub p2_buttons_mask: u32,
    pub p1_stick_x: f32,
    pub p2_stick_x: f32,
    pub delta_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FrameTickResponse {
    pub current_frame: u64,
    pub total_elapsed_seconds: f64,
    pub ticks_executed: u32,
    pub p1_direction_x: f32,
    pub p2_direction_x: f32,
    pub p1_attack_active: bool,
    pub p2_attack_active: bool,
}

#[derive(Debug, Serialize)]
pub struct GameHealthResponse {
    pub status: &'static str,
    pub target_fps: u32,
    pub engine: &'static str,
    pub renderer: &'static str,
    pub coordinate_system: &'static str,
}

/// Handler for retrieving a migrated Bevy scene bundle
pub async fn get_scene_handler(
    Query(query): Query<SceneQuery>,
) -> Result<Json<BevySceneBundle>, StatusCode> {
    let character_name = query.character.unwrap_or_else(|| "Goku_SuperSaiyan".to_string());

    // Build migrated Bevy scene bundle with ArcSys cel-shading and proper coordinate mapping
    let mut scene = BevySceneBundle {
        scene_name: format!("{}_BevyScene", character_name),
        source_uasset: format!("/Game/Characters/{}/Meshes/SK_{}.uasset", character_name, character_name),
        engine_source: "Unreal Engine 5.4 -> Bevy 0.15 Sovereign Migrator".into(),
        entities: Vec::new(),
    };

    // Add Player 1 Entity (facing Right in Bevy space)
    scene.entities.push(BevyMigratedEntity {
        entity_name: format!("{}_P1", character_name),
        transform: BevyTransform::from_unreal_coords(-150.0, 0.0, 0.0),
        mesh_asset_path: Some(format!("models/{}.gltf", character_name.to_lowercase())),
        material: ArcSysCelMaterial {
            base_color_texture: format!("textures/{}_base.png", character_name.to_lowercase()),
            ilm_texture: format!("textures/{}_ilm.png", character_name.to_lowercase()),
            normal_texture: format!("textures/{}_normal.png", character_name.to_lowercase()),
            outline_thickness: 1.25,
            ramp_threshold: 0.18,
            specular_power: 32.0,
            normal_steering: true,
        },
        is_player: true,
        collider_half_extents: Some([0.45, 0.95, 0.45]),
    });

    // Add Player 2 Entity (facing Left in Bevy space)
    scene.entities.push(BevyMigratedEntity {
        entity_name: format!("{}_P2", character_name),
        transform: BevyTransform::from_unreal_coords(150.0, 0.0, 0.0),
        mesh_asset_path: Some(format!("models/{}.gltf", character_name.to_lowercase())),
        material: ArcSysCelMaterial {
            base_color_texture: format!("textures/{}_base_color2.png", character_name.to_lowercase()),
            ilm_texture: format!("textures/{}_ilm.png", character_name.to_lowercase()),
            normal_texture: format!("textures/{}_normal.png", character_name.to_lowercase()),
            outline_thickness: 1.25,
            ramp_threshold: 0.18,
            specular_power: 32.0,
            normal_steering: true,
        },
        is_player: true,
        collider_half_extents: Some([0.45, 0.95, 0.45]),
    });

    Ok(Json(scene))
}

/// Handler for deterministic frame tick simulation
pub async fn post_tick_handler(
    State(state): State<GameServerState>,
    Json(payload): Json<FrameTickRequest>,
) -> Result<Json<FrameTickResponse>, StatusCode> {
    let mut clock = state.clock.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let mut p1 = state.p1_input.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let mut p2 = state.p2_input.lock().map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    p1.buttons_down = payload.p1_buttons_mask;
    p1.left_stick_x = payload.p1_stick_x;
    p2.buttons_down = payload.p2_buttons_mask;
    p2.left_stick_x = payload.p2_stick_x;

    // Advance clock deterministically by delta
    let ticks = clock.advance(payload.delta_seconds);

    let p1_attack = p1.is_down(InputState::BUTTON_A)
        || p1.is_down(InputState::BUTTON_B)
        || p1.is_down(InputState::BUTTON_X)
        || p1.is_down(InputState::BUTTON_Y);

    let p2_attack = p2.is_down(InputState::BUTTON_A)
        || p2.is_down(InputState::BUTTON_B)
        || p2.is_down(InputState::BUTTON_X)
        || p2.is_down(InputState::BUTTON_Y);

    Ok(Json(FrameTickResponse {
        current_frame: clock.current_frame,
        total_elapsed_seconds: clock.total_elapsed,
        ticks_executed: ticks,
        p1_direction_x: p1.left_stick_x,
        p2_direction_x: p2.left_stick_x,
        p1_attack_active: p1_attack,
        p2_attack_active: p2_attack,
    }))
}

/// Health check route for the game backend
pub async fn get_health_handler() -> impl IntoResponse {
    Json(GameHealthResponse {
        status: "healthy",
        target_fps: 60,
        engine: "Bevy 0.15 + Axum 0.8 Sovereign Stack",
        renderer: "WebGPU (WGPU 30) + ArcSys Cel-Shading WGSL",
        coordinate_system: "Right-Handed Y-Up (UE5 Left-Handed Z-Up converted)",
    })
}

/// Builds the Axum Router for Game Backend
pub fn game_router(state: GameServerState) -> Router {
    Router::new()
        .route("/api/game/bevy/health", get(get_health_handler))
        .route("/api/game/bevy/scene", get(get_scene_handler))
        .route("/api/game/bevy/tick", post(post_tick_handler))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_game_server_state_initialization() {
        let state = GameServerState::default();
        let clock = state.clock.lock().unwrap();
        assert_eq!(clock.target_fps, 60);
        assert_eq!(clock.current_frame, 0);
    }

    #[tokio::test]
    async fn test_scene_generation_and_bevy_mapping() {
        let query = Query(SceneQuery {
            character: Some("Vegeta_SuperSaiyan".into()),
        });
        let result = get_scene_handler(query).await.unwrap();
        let scene = result.0;

        assert_eq!(scene.scene_name, "Vegeta_SuperSaiyan_BevyScene");
        assert_eq!(scene.entities.len(), 2);
        assert!(scene.entities[0].material.normal_steering);
        assert_eq!(scene.entities[0].material.outline_thickness, 1.25);
    }

    #[tokio::test]
    async fn test_deterministic_tick_simulation() {
        let state = GameServerState::default();
        let payload = FrameTickRequest {
            p1_buttons_mask: InputState::BUTTON_A,
            p2_buttons_mask: InputState::BUTTON_X,
            p1_stick_x: 1.0,
            p2_stick_x: -1.0,
            delta_seconds: 0.0333, // ~2 frames at 60fps
        };

        let result = post_tick_handler(State(state), Json(payload)).await.unwrap();
        let resp = result.0;

        assert!(resp.current_frame >= 1);
        assert_eq!(resp.p1_direction_x, 1.0);
        assert_eq!(resp.p2_direction_x, -1.0);
        assert!(resp.p1_attack_active);
        assert!(resp.p2_attack_active);
    }
}
