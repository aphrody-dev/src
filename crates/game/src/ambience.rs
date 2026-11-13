//! Procedural audio playback: wind by day, a pad by night, footsteps from the controller.

use bevy::audio::{AudioPlayer, AudioSink, AudioSinkPlayback, AudioSource, PlaybackSettings, Volume};
use bevy::prelude::*;

use crate::daynight::{TimeOfDay, elevation};
use crate::player::Footstep;
use crate::synth;

#[derive(Component)]
struct Wind;

#[derive(Component)]
struct Pad;

#[derive(Resource)]
struct StepSound(Handle<AudioSource>);

pub struct AmbiencePlugin;

impl Plugin for AmbiencePlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, start)
            .add_systems(Update, (crossfade, play_footsteps));
    }
}

fn source(samples: &[f32]) -> AudioSource {
    AudioSource {
        bytes: synth::wav_bytes(samples).into(),
    }
}

fn start(mut commands: Commands, mut sources: ResMut<Assets<AudioSource>>) {
    let loop_settings = |volume: f32| PlaybackSettings::LOOP.with_volume(Volume::Linear(volume));
    commands.spawn((
        Wind,
        AudioPlayer::new(sources.add(source(&synth::wind_loop(6.0)))),
        loop_settings(0.3),
    ));
    commands.spawn((
        Pad,
        AudioPlayer::new(sources.add(source(&synth::pad_loop(8.0)))),
        loop_settings(0.0),
    ));
    commands.insert_resource(StepSound(sources.add(source(&synth::footstep()))));
}

fn crossfade(
    tod: Res<TimeOfDay>,
    mut wind: Query<&mut AudioSink, (With<Wind>, Without<Pad>)>,
    mut pad: Query<&mut AudioSink, (With<Pad>, Without<Wind>)>,
) {
    let night = (-elevation(tod.hour) * 3.0).clamp(0.0, 1.0);
    for mut s in &mut wind {
        s.set_volume(Volume::Linear(0.3 * (1.0 - 0.7 * night)));
    }
    for mut s in &mut pad {
        s.set_volume(Volume::Linear(0.5 * night));
    }
}

fn play_footsteps(
    mut commands: Commands,
    mut steps: MessageReader<Footstep>,
    sound: Res<StepSound>,
) {
    for _ in steps.read().take(1) {
        commands.spawn((
            AudioPlayer::new(sound.0.clone()),
            PlaybackSettings::DESPAWN.with_volume(Volume::Linear(0.5)),
        ));
    }
}
