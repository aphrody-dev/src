// SPDX-License-Identifier: Apache-2.0
//! Headless Bevy `App`: a CSS declaration list lowered by `aphrody-ui` becomes a `Node` component
//! in a world that runs without a window or a GPU.
#![cfg(feature = "bevy")]

use aphrody_ui::layout::{TokenTable, css_to_bevy_node};
use bevy::MinimalPlugins;
use bevy::app::App;
use bevy::ui::{Node, Val};

#[test]
fn node_from_css_lives_in_a_headless_app() {
    let node = css_to_bevy_node("width: 120px; height: 48px", &TokenTable::default()).expect("css");
    let mut app = App::new();
    app.add_plugins(MinimalPlugins);
    let entity = app.world_mut().spawn(node).id();
    app.update();
    let node = app.world().get::<Node>(entity).expect("Node component");
    assert_eq!(node.width, Val::Px(120.0));
    assert_eq!(node.height, Val::Px(48.0));
}
