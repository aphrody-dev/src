//! Third-person controller: the character walks on the analytic terrain height, the camera orbits
//! it with yaw/pitch from mouse or right stick.

use bevy::camera::Exposure;
use bevy::prelude::*;
use bevy::render::view::{Msaa, Tonemapping};
use bevy::world_serialization::WorldAssetRoot;

use crate::WORLD_SEED;
use crate::controls::Controls;
use crate::noise;

#[derive(Component)]
pub struct Player {
    velocity: Vec3,
    grounded: bool,
    walk_phase: f32,
}

#[derive(Component)]
pub struct MainCamera;

#[derive(Resource)]
struct CameraRig {
    yaw: f32,
    pitch: f32,
    distance: f32,
}

/// Seconds-per-footstep source for the audio module.
#[derive(Message)]
pub struct Footstep;

const WALK_SPEED: f32 = 6.0;
const SPRINT_SPEED: f32 = 11.0;
const GRAVITY: f32 = 26.0;
const JUMP_SPEED: f32 = 9.0;

pub struct PlayerPlugin;

impl Plugin for PlayerPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(CameraRig {
            yaw: 0.0,
            pitch: 0.35,
            distance: 7.0,
        })
        .add_message::<Footstep>()
        .add_systems(Startup, spawn)
        .add_systems(Update, (move_player, animate_limbs, orbit_camera).chain());
    }
}

fn spawn(mut commands: Commands, assets: Res<AssetServer>) {
    let y = noise::height(WORLD_SEED, 0.0, 0.0);
    commands.spawn((
        Player {
            velocity: Vec3::ZERO,
            grounded: true,
            walk_phase: 0.0,
        },
        WorldAssetRoot(assets.load(GltfAssetLabel::Scene(0).from_asset("models/explorer.glb"))),
        Transform::from_xyz(0.0, y, 0.0),
    ));
    commands.spawn((
        MainCamera,
        Camera3d::default(),
        // Sun 12000 lx and ambient in the hundreds of cd/m2 need an exposure near overcast, else the
        // default EV 9.7 clips the terrain to pale green; MSAA and tonemapping stated explicitly.
        Exposure { ev100: 12.5 },
        Tonemapping::TonyMcMapface,
        Msaa::Sample4,
        Transform::from_xyz(0.0, y + 4.0, 8.0).looking_at(Vec3::new(0.0, y + 1.5, 0.0), Vec3::Y),
        DistanceFog {
            color: Color::srgb(0.45, 0.68, 0.95),
            falloff: FogFalloff::Linear {
                start: 110.0,
                end: 215.0,
            },
            ..default()
        },
    ));
}

fn move_player(
    controls: Res<Controls>,
    rig: Res<CameraRig>,
    time: Res<Time>,
    mut query: Query<(&mut Player, &mut Transform)>,
    mut steps: MessageWriter<Footstep>,
) {
    let Ok((mut player, mut tf)) = query.single_mut() else {
        return;
    };
    let dt = time.delta_secs().min(0.05);
    // Camera-relative movement on the ground plane.
    let yaw_rot = Quat::from_rotation_y(rig.yaw);
    let wish = yaw_rot * Vec3::new(controls.movement.x, 0.0, -controls.movement.y);
    let speed = if controls.sprint {
        SPRINT_SPEED
    } else {
        WALK_SPEED
    };
    let target = wish * speed;
    let accel = if player.grounded { 14.0 } else { 3.0 };
    let horizontal = Vec3::new(player.velocity.x, 0.0, player.velocity.z)
        .lerp(target, (accel * dt).min(1.0));
    player.velocity.x = horizontal.x;
    player.velocity.z = horizontal.z;
    player.velocity.y -= GRAVITY * dt;
    if controls.jump && player.grounded {
        player.velocity.y = JUMP_SPEED;
        player.grounded = false;
    }
    tf.translation += player.velocity * dt;

    let ground = noise::height(WORLD_SEED, tf.translation.x, tf.translation.z);
    if tf.translation.y <= ground {
        tf.translation.y = ground;
        player.velocity.y = 0.0;
        player.grounded = true;
    }

    let flat_speed = horizontal.length();
    if flat_speed > 0.3 {
        let heading = Quat::from_rotation_y((-horizontal.x).atan2(-horizontal.z));
        tf.rotation = tf.rotation.slerp(heading, (12.0 * dt).min(1.0));
        if player.grounded {
            let before = player.walk_phase;
            // One stride (two steps) per 2.6 m travelled.
            player.walk_phase += flat_speed * dt / 2.6 * std::f32::consts::TAU;
            let (a, b) = (before / std::f32::consts::PI, player.walk_phase / std::f32::consts::PI);
            if a.floor() != b.floor() {
                steps.write(Footstep);
            }
        }
    } else {
        player.walk_phase = 0.0;
    }
}

/// Swings the joints that `gen-assets` names `leg_l`, `leg_r`, `arm_l`, `arm_r`.
fn animate_limbs(
    player: Query<&Player>,
    mut limbs: Query<(&Name, &mut Transform), Without<Player>>,
) {
    let Ok(player) = player.single() else {
        return;
    };
    let amp = (Vec3::new(player.velocity.x, 0.0, player.velocity.z).length() / SPRINT_SPEED)
        .min(1.0)
        * 0.9;
    let swing = player.walk_phase.sin() * amp;
    for (name, mut tf) in &mut limbs {
        let angle = match name.as_str() {
            "leg_l" | "arm_r" => swing,
            "leg_r" | "arm_l" => -swing,
            _ => continue,
        };
        tf.rotation = Quat::from_rotation_x(angle);
    }
}

fn orbit_camera(
    controls: Res<Controls>,
    mut rig: ResMut<CameraRig>,
    player: Query<&Transform, With<Player>>,
    mut camera: Query<&mut Transform, (With<MainCamera>, Without<Player>)>,
) {
    let (Ok(p), Ok(mut cam)) = (player.single(), camera.single_mut()) else {
        return;
    };
    rig.yaw -= controls.look.x;
    rig.pitch = (rig.pitch + controls.look.y).clamp(-0.2, 1.3);
    let focus = p.translation + Vec3::Y * 1.5;
    let offset = Quat::from_rotation_y(rig.yaw)
        * Quat::from_rotation_x(-rig.pitch)
        * Vec3::new(0.0, 0.0, rig.distance);
    let mut pos = focus + offset;
    // Keep the camera above the ground.
    pos.y = pos.y.max(noise::height(WORLD_SEED, pos.x, pos.z) + 0.6);
    *cam = Transform::from_translation(pos).looking_at(focus, Vec3::Y);
}
