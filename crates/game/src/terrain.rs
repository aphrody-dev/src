//! Chunk streaming: chunks within `VIEW_RADIUS` of the player are generated nearest first with a
//! per-frame budget, chunks beyond `VIEW_RADIUS + 1` are despawned.

use std::collections::HashMap;

use bevy::asset::RenderAssetUsages;
use bevy::mesh::{Indices, PrimitiveTopology};
use bevy::prelude::*;

use crate::WORLD_SEED;
use crate::player::Player;
use crate::terrain_mesh::{CHUNK_SIZE, build_chunk};

/// Chunks kept around the player (radius in chunks): 7 x 32 m = 224 m of view distance.
pub const VIEW_RADIUS: i32 = 7;
/// Chunk meshes built per frame: bounds the cost of a frame while streaming.
const BUDGET_PER_FRAME: usize = 3;

#[derive(Resource, Default)]
struct LoadedChunks(HashMap<IVec2, Entity>);

#[derive(Resource)]
struct TerrainMaterial(Handle<StandardMaterial>);

#[derive(Component)]
struct Chunk;

pub struct TerrainPlugin;

impl Plugin for TerrainPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<LoadedChunks>()
            .add_systems(Startup, setup_material)
            .add_systems(Update, stream_chunks);
    }
}

fn setup_material(mut commands: Commands, mut materials: ResMut<Assets<StandardMaterial>>) {
    commands.insert_resource(TerrainMaterial(materials.add(StandardMaterial {
        base_color: Color::WHITE, // vertex colors carry the biome
        perceptual_roughness: 0.95,
        ..default()
    })));
}

fn chunk_of(p: Vec3) -> IVec2 {
    IVec2::new(
        (p.x / CHUNK_SIZE).floor() as i32,
        (p.z / CHUNK_SIZE).floor() as i32,
    )
}

fn stream_chunks(
    mut commands: Commands,
    player: Query<&Transform, With<Player>>,
    mut loaded: ResMut<LoadedChunks>,
    mut meshes: ResMut<Assets<Mesh>>,
    material: Res<TerrainMaterial>,
) {
    let Ok(tf) = player.single() else {
        return;
    };
    let centre = chunk_of(tf.translation);

    loaded.0.retain(|coord, entity| {
        let keep = (coord - centre).abs().max_element() <= VIEW_RADIUS + 1;
        if !keep {
            commands.entity(*entity).despawn();
        }
        keep
    });

    let mut missing: Vec<IVec2> = (-VIEW_RADIUS..=VIEW_RADIUS)
        .flat_map(|dz| (-VIEW_RADIUS..=VIEW_RADIUS).map(move |dx| centre + IVec2::new(dx, dz)))
        .filter(|c| !loaded.0.contains_key(c))
        .collect();
    missing.sort_by_key(|c| (c - centre).length_squared());

    for coord in missing.into_iter().take(BUDGET_PER_FRAME) {
        let data = build_chunk(WORLD_SEED, coord.x, coord.y);
        let mut mesh = Mesh::new(
            PrimitiveTopology::TriangleList,
            RenderAssetUsages::RENDER_WORLD,
        );
        mesh.insert_attribute(Mesh::ATTRIBUTE_POSITION, data.positions);
        mesh.insert_attribute(Mesh::ATTRIBUTE_NORMAL, data.normals);
        mesh.insert_attribute(Mesh::ATTRIBUTE_COLOR, data.colors);
        mesh.insert_indices(Indices::U32(data.indices));
        let entity = commands
            .spawn((
                Chunk,
                Mesh3d(meshes.add(mesh)),
                MeshMaterial3d(material.0.clone()),
                Transform::IDENTITY,
            ))
            .id();
        loaded.0.insert(coord, entity);
    }
}
