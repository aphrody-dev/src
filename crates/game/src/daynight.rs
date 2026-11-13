//! Day/night cycle: the sun is a directional light that follows the hour; sky color, fog, light
//! intensity and ambient light follow its elevation.

use bevy::light::GlobalAmbientLight;
use bevy::prelude::*;

use crate::controls::Controls;
use crate::player::MainCamera;

/// Hour of the day in `[0, 24)`.
#[derive(Resource)]
pub struct TimeOfDay {
    pub hour: f32,
    /// Real seconds for one 24 h game day.
    pub day_seconds: f32,
}

#[derive(Component)]
struct Sun;

pub struct DayNightPlugin;

impl Plugin for DayNightPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(TimeOfDay {
            hour: 9.0,
            day_seconds: 240.0,
        })
        .insert_resource(ClearColor(Color::srgb(0.45, 0.68, 0.95)))
        .add_systems(Startup, spawn_sun)
        .add_systems(Update, update_sky);
    }
}

fn spawn_sun(mut commands: Commands) {
    commands.spawn((
        Sun,
        DirectionalLight {
            shadow_maps_enabled: true,
            illuminance: 10_000.0,
            ..default()
        },
        Transform::default(),
    ));
}

/// Sun elevation in `[-1, 1]`: 1 at noon, -1 at midnight, 0 at 6 h and 18 h.
pub fn elevation(hour: f32) -> f32 {
    ((hour - 6.0) / 24.0 * std::f32::consts::TAU).sin()
}

fn mix(a: Vec3, b: Vec3, t: f32) -> Vec3 {
    a + (b - a) * t.clamp(0.0, 1.0)
}

/// Sky color: night blue, orange near the horizon, day blue.
pub fn sky_color(elev: f32) -> Vec3 {
    let night = Vec3::new(0.015, 0.025, 0.07);
    let dusk = Vec3::new(0.92, 0.50, 0.30);
    let day = Vec3::new(0.45, 0.68, 0.95);
    if elev < 0.0 {
        mix(dusk, night, -elev * 4.0)
    } else {
        mix(dusk, day, elev * 3.0)
    }
}

fn update_sky(
    time: Res<Time>,
    controls: Res<Controls>,
    mut tod: ResMut<TimeOfDay>,
    mut sun: Query<(&mut Transform, &mut DirectionalLight), With<Sun>>,
    mut clear: ResMut<ClearColor>,
    mut ambient: ResMut<GlobalAmbientLight>,
    mut fog: Query<&mut DistanceFog, With<MainCamera>>,
) {
    if controls.time_scale_toggle {
        // T: day lasts 20 s instead of 240 s, to watch the cycle.
        tod.day_seconds = if tod.day_seconds > 100.0 { 20.0 } else { 240.0 };
    }
    tod.hour = (tod.hour + time.delta_secs() / tod.day_seconds * 24.0) % 24.0;
    let elev = elevation(tod.hour);
    let angle = (tod.hour - 6.0) / 24.0 * std::f32::consts::TAU;
    if let Ok((mut tf, mut light)) = sun.single_mut() {
        // Rises in the east (+x), sets in the west, tilted towards the south.
        tf.rotation = Quat::from_rotation_y(0.5) * Quat::from_rotation_x(-angle);
        light.illuminance = 12_000.0 * (elev * 3.0).clamp(0.0, 1.0);
        light.shadow_maps_enabled = elev > 0.02;
    }
    let sky = sky_color(elev);
    let color = Color::srgb(sky.x, sky.y, sky.z);
    clear.0 = color;
    ambient.color = Color::srgb(0.55 + 0.3 * sky.x, 0.6 + 0.3 * sky.y, 0.8 + 0.2 * sky.z);
    ambient.brightness = 40.0 + 260.0 * (elev * 2.0 + 0.5).clamp(0.0, 1.0);
    if let Ok(mut f) = fog.single_mut() {
        f.color = color;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn elevation_extremes() {
        assert!((elevation(12.0) - 1.0).abs() < 1e-5);
        assert!((elevation(0.0) + 1.0).abs() < 1e-5);
        assert!(elevation(6.0).abs() < 1e-5);
    }

    #[test]
    fn night_is_darker_than_day() {
        assert!(sky_color(-1.0).length() < sky_color(1.0).length());
    }
}
