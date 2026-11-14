//! Input unified from keyboard, mouse and gamepad into one `Controls` resource per frame.

use bevy::input::mouse::AccumulatedMouseMotion;
use bevy::prelude::*;
use bevy::window::{CursorGrabMode, CursorOptions, PrimaryWindow};

#[derive(Resource, Default, Debug)]
pub struct Controls {
    /// Movement in the camera frame: x right, y forward, length at most 1.
    pub movement: Vec2,
    /// Look delta in radians for this frame (yaw, pitch).
    pub look: Vec2,
    pub jump: bool,
    pub sprint: bool,
    pub time_scale_toggle: bool,
}

pub struct ControlsPlugin;

impl Plugin for ControlsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<Controls>()
            .add_systems(PreUpdate, (read_controls, cursor_lock));
    }
}

const MOUSE_SENS: f32 = 0.0025;
const STICK_LOOK_RATE: f32 = 2.6; // radians per second at full deflection
const DEADZONE: f32 = 0.15;

fn deadzone(v: Vec2) -> Vec2 {
    let len = v.length();
    if len < DEADZONE {
        Vec2::ZERO
    } else {
        v / len * ((len - DEADZONE) / (1.0 - DEADZONE)).min(1.0)
    }
}

fn read_controls(
    keys: Res<ButtonInput<KeyCode>>,
    motion: Res<AccumulatedMouseMotion>,
    gamepads: Query<&Gamepad>,
    time: Res<Time>,
    window: Query<&CursorOptions, With<PrimaryWindow>>,
    mut controls: ResMut<Controls>,
) {
    let mut mv = Vec2::ZERO;
    // Physical key positions (WASD) and the French layout letters (ZQSD) both work.
    if keys.any_pressed([KeyCode::KeyW, KeyCode::ArrowUp]) {
        mv.y += 1.0;
    }
    if keys.any_pressed([KeyCode::KeyS, KeyCode::ArrowDown]) {
        mv.y -= 1.0;
    }
    if keys.any_pressed([KeyCode::KeyD, KeyCode::ArrowRight]) {
        mv.x += 1.0;
    }
    if keys.any_pressed([KeyCode::KeyA, KeyCode::ArrowLeft]) {
        mv.x -= 1.0;
    }
    let mut jump = keys.just_pressed(KeyCode::Space);
    let mut sprint = keys.pressed(KeyCode::ShiftLeft);
    let mut look = Vec2::ZERO;
    if window
        .single()
        .is_ok_and(|c| c.grab_mode != CursorGrabMode::None)
    {
        look += motion.delta * MOUSE_SENS;
    }
    for pad in &gamepads {
        mv += deadzone(pad.left_stick());
        look += deadzone(pad.right_stick()) * Vec2::new(1.0, -1.0) * STICK_LOOK_RATE * time.delta_secs();
        jump |= pad.just_pressed(GamepadButton::South);
        sprint |= pad.pressed(GamepadButton::LeftThumb) || pad.pressed(GamepadButton::RightTrigger);
    }
    controls.movement = mv.clamp_length_max(1.0);
    controls.look = look;
    controls.jump = jump;
    controls.sprint = sprint;
    controls.time_scale_toggle = keys.just_pressed(KeyCode::KeyT);
}

/// Click captures the pointer for mouse look, Escape releases it.
fn cursor_lock(
    mouse: Res<ButtonInput<MouseButton>>,
    keys: Res<ButtonInput<KeyCode>>,
    mut window: Query<&mut CursorOptions, With<PrimaryWindow>>,
) {
    let Ok(mut cursor) = window.single_mut() else {
        return;
    };
    if mouse.just_pressed(MouseButton::Left) {
        cursor.grab_mode = CursorGrabMode::Locked;
        cursor.visible = false;
    }
    if keys.just_pressed(KeyCode::Escape) {
        cursor.grab_mode = CursorGrabMode::None;
        cursor.visible = true;
    }
}
