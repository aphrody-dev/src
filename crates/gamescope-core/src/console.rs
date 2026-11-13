//! The gamescope console shell: one focus-navigation core and scene model, two themeable layout variants
//! ([`Shell::Ps`]: tab bar and scale-up tile rows; [`Shell::Switch`]: status bar, tile row, round menu row, button
//! hints). All content is a static sample catalog: nothing here launches, buys or streams anything.

use crate::ui::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Shell {
    Ps,
    Switch,
}

impl Shell {
    pub fn from_code(code: u32) -> Shell {
        if code == 1 { Shell::Switch } else { Shell::Ps }
    }
    pub fn name(self) -> &'static str {
        match self {
            Shell::Ps => "ps",
            Shell::Switch => "switch",
        }
    }
}

/// Colors and metrics of a shell variant (Material 3 roles of the aphrody seed, dark for Ps, light for Switch).
#[derive(Clone, Copy, Debug)]
pub struct Theme {
    pub bg0: Color,
    pub bg1: Color,
    pub glow0: Color,
    pub glow1: Color,
    pub text: Color,
    pub dim: Color,
    pub surface: Color,
    pub surface_hi: Color,
    pub accent: Color,
    pub on_accent: Color,
    pub plate: Color,
    pub shadow: f32,
}

impl Theme {
    pub fn of(shell: Shell) -> Theme {
        match shell {
            Shell::Ps => Theme {
                bg0: rgb(0x140C0B),
                bg1: rgb(0x2A1A18),
                glow0: alpha(rgb(0x733428), 0.75),
                glow1: alpha(rgb(0x554519), 0.5),
                text: rgb(0xF1DFDB),
                dim: rgb(0xB5A29E),
                surface: rgb(0x271D1C),
                surface_hi: rgb(0x3D3230),
                accent: rgb(0xFFB4A6),
                on_accent: rgb(0x561E14),
                plate: rgb(0xE9E1DF),
                shadow: 0.55,
            },
            Shell::Switch => Theme {
                bg0: rgb(0xF4F0EF),
                bg1: rgb(0xDCD3D1),
                glow0: alpha(rgb(0xFFB4A6), 0.55),
                glow1: alpha(rgb(0xDCC48C), 0.45),
                text: rgb(0x201A19),
                dim: rgb(0x534340),
                surface: rgb(0xFFFFFF),
                surface_hi: rgb(0xF1E6E3),
                accent: rgb(0xCE422B),
                on_accent: rgb(0xFFFFFF),
                plate: rgb(0xFFFFFF),
                shadow: 0.28,
            },
        }
    }
}

// Atlas icon slots; the order matches `ICON_SOURCES` (the client draws "ui:" ones and loads "art:" files).
pub const IC_SEARCH: usize = 0;
pub const IC_SETTINGS: usize = 1;
pub const IC_MORE: usize = 2;
pub const IC_WISHLIST: usize = 3;
pub const IC_CART: usize = 4;
pub const IC_POWER: usize = 5;
pub const IC_PLUS: usize = 6;
pub const IC_USER: usize = 7;
pub const IC_CHECK: usize = 8;
pub const IC_WIFI: usize = 9;
pub const IC_PLAY: usize = 10;
pub const IC_STAR: usize = 11;
pub const IC_STEAM: usize = 12;
pub const IC_EPIC: usize = 13;
pub const IC_GOG: usize = 14;
pub const IC_ITCH: usize = 15;
pub const IC_XBOX: usize = 16;
pub const IC_NINTENDO: usize = 17;
pub const IC_FLATHUB: usize = 18;
pub const IC_FDROID: usize = 19;
pub const IC_GPLAY: usize = 20;
pub const IC_GITHUB: usize = 21;
pub const IC_BEVY: usize = 22;
pub const IC_ARTCRAFT: usize = 23;
pub const IC_OWNER: usize = 24;

/// "ui:<name>" is drawn by the client; "art:<file>" is fetched from /gamescope/art/ (vendor favicons, owner mark).
pub const ICON_SOURCES: [&str; 25] = [
    "ui:search", "ui:settings", "ui:more", "ui:wishlist", "ui:cart", "ui:power", "ui:plus", "ui:user", "ui:check",
    "ui:wifi", "ui:play", "ui:star", "art:steam.ico", "art:epic.ico", "art:gog.png", "art:itch.ico", "art:xbox.png",
    "art:nintendo.png", "art:flathub.png", "art:fdroid.png", "art:googleplay.ico", "art:github.svg", "art:bevy.png",
    "art:artcraft.png", "art:owner.png",
];

#[derive(Debug)]
pub struct Tile {
    pub title: &'static str,
    pub sub: &'static str,
    pub icon: Option<usize>,
    pub seed: f32,
    /// Vendor favicon on a light plate instead of generated art.
    pub plate: bool,
}

const fn tile(title: &'static str, sub: &'static str, icon: Option<usize>, seed: f32, plate: bool) -> Tile {
    Tile { title, sub, icon, seed, plate }
}

static GAMES: [Tile; 12] = [
    tile("Veloren", "Voxel open-world RPG", None, 1.0, false),
    tile("Xonotic", "Arena shooter", None, 2.0, false),
    tile("SuperTuxKart", "Kart racing", None, 3.0, false),
    tile("0 A.D.", "Ancient warfare RTS", None, 4.0, false),
    tile("Mindustry", "Factory tower defense", None, 5.0, false),
    tile("OpenTTD", "Transport tycoon", None, 6.0, false),
    tile("Luanti", "Voxel game engine", None, 7.0, false),
    tile("Wesnoth", "Turn-based strategy", None, 8.0, false),
    tile("Cataclysm", "Survival roguelike", None, 9.0, false),
    tile("Pioneer", "Space exploration", None, 10.0, false),
    tile("Armagetron", "Light cycles", None, 11.0, false),
    tile("FreeCiv", "Empire building", None, 12.0, false),
];

static APPS: [Tile; 10] = [
    tile("Steam", "Store", Some(IC_STEAM), 0.0, true),
    tile("Epic Games", "Store", Some(IC_EPIC), 0.0, true),
    tile("GOG", "Store", Some(IC_GOG), 0.0, true),
    tile("itch.io", "Indie store", Some(IC_ITCH), 0.0, true),
    tile("Xbox", "Console store", Some(IC_XBOX), 0.0, true),
    tile("Nintendo", "Console store", Some(IC_NINTENDO), 0.0, true),
    tile("Flathub", "Linux apps", Some(IC_FLATHUB), 0.0, true),
    tile("F-Droid", "Android apps", Some(IC_FDROID), 0.0, true),
    tile("Google Play", "Android store", Some(IC_GPLAY), 0.0, true),
    tile("GitHub", "Source", Some(IC_GITHUB), 0.0, true),
];

static EXPLORE: [Tile; 5] = [
    tile("Bevy", "Game engine", Some(IC_BEVY), 21.0, false),
    tile("ArtCraft", "Creative suite", Some(IC_ARTCRAFT), 22.0, false),
    tile("Gamescope", "This console UI", Some(IC_OWNER), 23.0, false),
    tile("Play", "Browser game", Some(IC_OWNER), 24.0, false),
    tile("Craft apps", "Open creative tools", Some(IC_ARTCRAFT), 25.0, false),
];

static CRAFT: [Tile; 8] = [
    tile("Photocraft", "Photo editor", None, 31.0, false),
    tile("Filmcraft", "Video editor", None, 32.0, false),
    tile("Soundcraft", "Audio workstation", None, 33.0, false),
    tile("Vectorcraft", "Vector design", None, 34.0, false),
    tile("Lightcraft", "RAW developer", None, 35.0, false),
    tile("Designcraft", "Layout design", None, 36.0, false),
    tile("Effectcraft", "Motion effects", None, 37.0, false),
    tile("Gridcraft", "Spreadsheets", None, 38.0, false),
];

static VIDEO: [Tile; 6] = [
    tile("Timeline", "Edit", None, 41.0, false),
    tile("Render queue", "Export", None, 42.0, false),
    tile("Captions", "Subtitles", None, 43.0, false),
    tile("Color grade", "Look", None, 44.0, false),
    tile("Mixer", "Audio", None, 45.0, false),
    tile("Exports", "Library", None, 46.0, false),
];

static ROUND: [(&str, usize); 6] = [
    ("Store", IC_CART),
    ("Media", IC_PLAY),
    ("Achievements", IC_STAR),
    ("Search", IC_SEARCH),
    ("Settings", IC_SETTINGS),
    ("Power", IC_POWER),
];

static TOP_ICONS: [(&str, usize); 5] = [
    ("Search", IC_SEARCH),
    ("Settings", IC_SETTINGS),
    ("More", IC_MORE),
    ("Wishlist", IC_WISHLIST),
    ("Cart", IC_CART),
];

static PROFILES: [(&str, f32); 3] = [("Aphrody", 51.0), ("Guest", 52.0), ("Dev", 53.0)];
static TABS: [&str; 4] = ["Games", "Media", "Store", "Achievements"];

/// (title, description, tier 0 bronze / 1 silver / 2 gold, progress percent): sample data.
static ACHIEVEMENTS: [(&str, &str, u8, u32); 8] = [
    ("First Light", "Open the console for the first time", 0, 100),
    ("Pathfinder", "Move focus across every row", 0, 100),
    ("Collector", "Add 25 titles to a library", 1, 64),
    ("Night Owl", "Use the console after midnight", 0, 100),
    ("Full Stack", "Link all four stores", 1, 40),
    ("Marathon", "Ten hours in one session", 2, 22),
    ("Perfectionist", "Finish every achievement", 2, 8),
    ("Explorer", "Visit every tab", 1, 75),
];

const TIER_NAMES: [&str; 3] = ["Bronze", "Silver", "Gold"];
const ROW_X0: f32 = 96.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Style {
    Small,
    Streaming,
    Wide,
}

impl Style {
    /// Tile size at selection amount `t` (0 default, 1 selected): 106 to 181 and 237x202 to 253x217 in the PS layout.
    pub fn dims(self, t: f32) -> (f32, f32) {
        match self {
            Style::Small => {
                let s = lerp(106.0, 181.0, t);
                (s, s)
            }
            Style::Streaming => (lerp(237.0, 253.0, t), lerp(202.0, 217.0, t)),
            Style::Wide => {
                let s = lerp(280.0, 300.0, t);
                (s, s)
            }
        }
    }
    fn gap(self) -> f32 {
        if self == Style::Wide { 28.0 } else { 24.0 }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Action {
    SignIn(usize),
    SwitchUser,
    OpenOverlay,
    CloseOverlay,
    Tab(usize),
    Page(usize),
    Launch(&'static str),
    Say(&'static str),
    Card(usize),
    Achv(usize),
}

#[derive(Clone, Copy, Debug)]
pub enum Kind {
    Profile(usize),
    AddUser,
    Power,
    Avatar,
    TopIcon(usize),
    Tab(usize),
    Tile(&'static Tile, Style),
    Card(usize),
    Btn(&'static str, bool),
    Achv(usize),
    OverlayItem(&'static str),
    Round(usize, &'static str),
}

#[derive(Clone, Copy, Debug)]
pub struct Item {
    pub rect: Rect,
    pub action: Action,
    pub fixed: bool,
    pub row: Option<usize>,
    pub col: usize,
    pub kind: Kind,
}

impl Item {
    fn new(rect: Rect, action: Action, kind: Kind) -> Item {
        Item { rect, action, fixed: false, row: None, col: 0, kind }
    }
    fn fixed(mut self) -> Item {
        self.fixed = true;
        self
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Screen {
    Login,
    Home,
}

#[derive(Clone, Copy, Debug)]
struct RowMeta {
    top: f32,
    style: Style,
}

pub struct App {
    shell: Shell,
    screen: Screen,
    tab: usize,
    page: Option<usize>,
    overlay: bool,
    guide: bool,
    profile: usize,
    items: Vec<Item>,
    rows: Vec<RowMeta>,
    sel: Vec<Smooth>,
    row_scroll: Vec<Smooth>,
    scroll_y: Smooth,
    enter: Smooth,
    focus: usize,
    store_sel: usize,
    toast: Option<(String, f32)>,
    clock: u32,
    time: f32,
    advances: Vec<f32>,
    hit: Vec<Rect>,
}

impl Default for App {
    fn default() -> Self {
        Self::new(Shell::Ps)
    }
}

impl App {
    pub fn new(shell: Shell) -> App {
        let mut a = App {
            shell,
            screen: Screen::Login,
            tab: 0,
            page: None,
            overlay: false,
            guide: false,
            profile: 0,
            items: Vec::new(),
            rows: Vec::new(),
            sel: Vec::new(),
            row_scroll: Vec::new(),
            scroll_y: Smooth::new(0.0),
            enter: Smooth::new(1.0),
            focus: 0,
            store_sel: 0,
            toast: None,
            clock: 10 * 60 + 32,
            time: 0.0,
            advances: Vec::new(),
            hit: Vec::new(),
        };
        a.build(Some(Action::SignIn(0)));
        a
    }

    pub fn shell(&self) -> Shell {
        self.shell
    }
    pub fn screen(&self) -> Screen {
        self.screen
    }
    pub fn tab(&self) -> usize {
        self.tab
    }
    pub fn page(&self) -> Option<usize> {
        self.page
    }
    pub fn overlay_open(&self) -> bool {
        self.overlay
    }
    pub fn focus_index(&self) -> usize {
        self.focus
    }
    pub fn items(&self) -> &[Item] {
        &self.items
    }
    pub fn toast_text(&self) -> Option<&str> {
        self.toast.as_ref().map(|t| t.0.as_str())
    }

    pub fn set_advances(&mut self, adv: Vec<f32>) {
        self.advances = adv;
        let hint = self.items.get(self.focus).map(|i| i.action);
        self.build(hint);
    }

    pub fn set_clock(&mut self, minutes: u32) {
        self.clock = minutes % (24 * 60);
    }

    pub fn set_shell(&mut self, shell: Shell) {
        if shell != self.shell {
            self.shell = shell;
            self.page = None;
            self.overlay = false;
            self.guide = false;
            let hint = if self.screen == Screen::Login { Some(Action::SignIn(self.profile)) } else { None };
            self.build(hint);
        }
    }

    fn say(&mut self, msg: impl Into<String>) {
        self.toast = Some((msg.into(), 2.6));
    }

    fn text_w(&self, s: &str, size: f32) -> f32 {
        Painter::new(&self.advances).text_width(s, size)
    }

    // ---------------------------------------------------------------- layout

    fn tile_rows(&mut self, specs: &[(&'static [Tile], Style, f32)]) -> Vec<Item> {
        let mut out = Vec::new();
        for (r, &(tiles, style, top)) in specs.iter().enumerate() {
            self.rows.push(RowMeta { top, style });
            let (dw, dh) = style.dims(0.0);
            for (c, t) in tiles.iter().enumerate() {
                let act = if t.plate { Action::Say("Stores open in the real client: not built yet") } else { Action::Launch(t.title) };
                let mut it = Item::new(
                    Rect::new(ROW_X0 + c as f32 * (dw + style.gap()), top, dw, dh),
                    act,
                    Kind::Tile(t, style),
                );
                it.row = Some(r);
                it.col = c;
                out.push(it);
            }
        }
        out
    }

    fn content(&mut self, tab: usize) -> Vec<Item> {
        match tab {
            0 => self.tile_rows(&[(&GAMES[..], Style::Small, 470.0), (&APPS[..], Style::Small, 810.0), (&EXPLORE[..], Style::Small, 1150.0)]),
            1 => self.tile_rows(&[(&CRAFT[..], Style::Streaming, 440.0), (&VIDEO[..], Style::Small, 800.0)]),
            2 => {
                let mut v = Vec::new();
                for i in 0..6 {
                    let (c, r) = ((i % 3) as f32, (i / 3) as f32);
                    v.push(Item::new(Rect::new(ROW_X0 + c * 425.0, 240.0 + r * 240.0, 385.0, 192.0), Action::Card(i), Kind::Card(i)));
                }
                v.push(Item::new(Rect::new(1420.0, 690.0, 190.0, 68.0), Action::Say("Install is not built yet: this is a sample catalog"), Kind::Btn("Get", true)));
                v.push(Item::new(Rect::new(1626.0, 690.0, 198.0, 68.0), Action::Say("Subscriptions are not built yet"), Kind::Btn("Subscribe", false)));
                v
            }
            _ => (0..ACHIEVEMENTS.len())
                .map(|i| {
                    let (c, r) = ((i % 2) as f32, (i / 2) as f32);
                    Item::new(Rect::new(ROW_X0 + c * 880.0, 340.0 + r * 140.0, 840.0, 120.0), Action::Achv(i), Kind::Achv(i))
                })
                .collect(),
        }
    }

    /// Rebuilds the focus graph for the current screen and restores focus to the item with `hint` when present.
    fn build(&mut self, hint: Option<Action>) {
        self.rows.clear();
        let mut items: Vec<Item> = Vec::new();
        if self.overlay {
            for (i, (label, act)) in [("Switch user", Action::SwitchUser), ("Close", Action::CloseOverlay)].into_iter().enumerate() {
                items.push(Item::new(Rect::new(W - 96.0 - 400.0, 200.0 + i as f32 * 76.0, 380.0, 64.0), act, Kind::OverlayItem(label)));
            }
        } else if self.screen == Screen::Login {
            let x0 = (W - (4.0 * 160.0 + 3.0 * 120.0)) * 0.5;
            items.push(Item::new(Rect::new(x0, 420.0, 160.0, 160.0), Action::Say("Add user is not built yet"), Kind::AddUser));
            for i in 0..PROFILES.len() {
                items.push(Item::new(Rect::new(x0 + (i as f32 + 1.0) * 280.0, 420.0, 160.0, 160.0), Action::SignIn(i), Kind::Profile(i)));
            }
            items.push(Item::new(Rect::new(W * 0.5 - 36.0, 880.0, 72.0, 72.0), Action::Say("Power off is not available in a browser tab"), Kind::Power));
        } else {
            match self.shell {
                Shell::Ps => {
                    items.push(Item::new(Rect::new(96.0, 40.0, 64.0, 64.0), Action::OpenOverlay, Kind::Avatar).fixed());
                    let mut x = 200.0;
                    for (i, t) in TABS.iter().enumerate() {
                        let w = self.text_w(t, 34.0) + 40.0;
                        items.push(Item::new(Rect::new(x, 44.0, w, 56.0), Action::Tab(i), Kind::Tab(i)).fixed());
                        x += w + 12.0;
                    }
                    for (i, (n, _)) in TOP_ICONS.iter().enumerate() {
                        let msg: &'static str = match *n {
                            "Search" => "Search is not built yet",
                            "Settings" => "Settings are not built yet",
                            "More" => "More is not built yet",
                            "Wishlist" => "Wishlist is not built yet",
                            _ => "Cart is not built yet",
                        };
                        items.push(Item::new(Rect::new(W - 96.0 - 5.0 * 64.0 - 4.0 * 20.0 + i as f32 * 84.0, 40.0, 64.0, 64.0), Action::Say(msg), Kind::TopIcon(i)).fixed());
                    }
                    let c = self.content(self.tab);
                    items.extend(c);
                }
                Shell::Switch => {
                    items.push(Item::new(Rect::new(96.0, 36.0, 72.0, 72.0), Action::OpenOverlay, Kind::Avatar).fixed());
                    match self.page {
                        None => {
                            let t = self.tile_rows(&[(&GAMES[..9], Style::Wide, 330.0)]);
                            items.extend(t);
                            for (i, (n, ic)) in ROUND.iter().enumerate() {
                                let act = match i {
                                    0 => Action::Page(2),
                                    1 => Action::Page(1),
                                    2 => Action::Page(3),
                                    3 => Action::Say("Search is not built yet"),
                                    4 => Action::Say("Settings are not built yet"),
                                    _ => Action::Say("Power off is not available in a browser tab"),
                                };
                                items.push(Item::new(Rect::new(ROW_X0 + i as f32 * 160.0, 720.0, 104.0, 104.0), act, Kind::Round(*ic, n)).fixed());
                            }
                        }
                        Some(p) => {
                            let c = self.content(p);
                            items.extend(c);
                        }
                    }
                }
            }
        }
        self.items = items;
        self.sel = vec![Smooth::new(0.0); self.items.len()];
        self.row_scroll = vec![Smooth::new(0.0); self.rows.len()];
        self.scroll_y = Smooth::new(0.0);
        self.enter = Smooth { v: 0.0, t: 1.0 };
        self.focus = hint
            .and_then(|h| self.items.iter().position(|i| i.action == h))
            .or_else(|| self.items.iter().position(|i| !i.fixed))
            .unwrap_or(0);
        if let Some(Item { kind: Kind::Card(i), .. }) = self.items.get(self.focus) {
            self.store_sel = *i;
        }
        self.retarget();
        for (i, s) in self.sel.iter_mut().enumerate() {
            s.v = s.t;
            let _ = i;
        }
        self.row_scroll.iter_mut().for_each(|s| s.v = s.t);
        self.scroll_y.v = self.scroll_y.t;
    }

    fn retarget(&mut self) {
        let f = self.focus;
        for (i, s) in self.sel.iter_mut().enumerate() {
            s.t = if i == f { 1.0 } else { 0.0 };
        }
        let Some(it) = self.items.get(f) else { return };
        if let Kind::Card(i) = it.kind {
            self.store_sel = i;
        }
        if let Some(r) = it.row {
            let style = self.rows[r].style;
            let rest_x = it.col as f32 * (style.dims(0.0).0 + style.gap());
            self.row_scroll[r].t = (rest_x - 700.0).max(0.0);
            self.scroll_y.t = (self.rows[r].top - self.rows[0].top).max(0.0);
        } else if !it.fixed || self.screen == Screen::Home {
            self.scroll_y.t = 0.0;
        }
    }

    // ----------------------------------------------------------------- input

    pub fn input(&mut self, inp: Input) {
        if inp == Input::Options {
            self.guide = !self.guide;
            return;
        }
        match inp {
            Input::Dir(d) => {
                let rects: Vec<Rect> = self.items.iter().map(|i| i.rect).collect();
                if let Some(n) = spatial_next(&rects, self.focus, d) {
                    self.focus = n;
                    self.retarget();
                }
            }
            Input::Select => {
                if self.guide {
                    self.guide = false;
                } else if let Some(it) = self.items.get(self.focus).copied() {
                    self.activate(it.action);
                }
            }
            Input::Back => self.back(),
            Input::PrevTab | Input::NextTab => {
                if self.screen == Screen::Home && self.shell == Shell::Ps && !self.overlay {
                    let n = TABS.len();
                    let t = if inp == Input::NextTab { (self.tab + 1) % n } else { (self.tab + n - 1) % n };
                    self.activate(Action::Tab(t));
                }
            }
            Input::Options => {}
        }
    }

    fn back(&mut self) {
        if self.guide {
            self.guide = false;
        } else if self.overlay {
            self.activate(Action::CloseOverlay);
        } else if self.screen == Screen::Home {
            if let Some(p) = self.page {
                self.page = None;
                let hint = match p {
                    2 => Action::Page(2),
                    1 => Action::Page(1),
                    _ => Action::Page(3),
                };
                self.build(Some(hint));
            } else if self.items.get(self.focus).is_some_and(|i| !i.fixed) && self.shell == Shell::Ps {
                let t = Action::Tab(self.tab);
                if let Some(p) = self.items.iter().position(|i| i.action == t) {
                    self.focus = p;
                    self.retarget();
                }
            }
        }
    }

    fn activate(&mut self, a: Action) {
        match a {
            Action::SignIn(i) => {
                self.profile = i;
                self.screen = Screen::Home;
                self.tab = 0;
                self.page = None;
                self.build(None);
                self.say(format!("Signed in as {}", PROFILES[i].0));
            }
            Action::SwitchUser => {
                self.overlay = false;
                self.screen = Screen::Login;
                self.page = None;
                self.build(Some(Action::SignIn(self.profile)));
            }
            Action::OpenOverlay => {
                self.overlay = true;
                self.build(None);
            }
            Action::CloseOverlay => {
                self.overlay = false;
                self.build(Some(Action::OpenOverlay));
            }
            Action::Tab(t) => {
                self.tab = t;
                self.build(Some(Action::Tab(t)));
            }
            Action::Page(p) => {
                self.page = Some(p);
                self.tab = p;
                self.build(None);
            }
            Action::Launch(t) => self.say(format!("{t}: launching is not built yet (sample catalog, no game runtime)")),
            Action::Say(m) => self.say(m),
            Action::Card(i) => self.say(format!("{}: sample entry, nothing to install", GAMES[i].title)),
            Action::Achv(i) => self.say(format!("{}: {}", ACHIEVEMENTS[i].0, ACHIEVEMENTS[i].1)),
        }
    }

    /// Pointer in design coordinates (1920x1080): hover moves focus, a click activates.
    pub fn pointer(&mut self, x: f32, y: f32, click: bool) {
        if let Some(i) = self.hit.iter().rposition(|r| r.contains(x, y)) {
            if i != self.focus && i < self.items.len() {
                self.focus = i;
                self.retarget();
            }
            if click {
                self.activate(self.items[i].action);
            }
        }
    }

    pub fn update(&mut self, dt: f32) {
        let dt = dt.clamp(0.0, 0.1);
        self.time += dt;
        self.sel.iter_mut().for_each(|s| s.step(dt, 16.0));
        self.row_scroll.iter_mut().for_each(|s| s.step(dt, 8.0));
        self.scroll_y.step(dt, 8.0);
        self.enter.step(dt, 7.0);
        if let Some((_, t)) = &mut self.toast {
            *t -= dt;
            if *t <= 0.0 {
                self.toast = None;
            }
        }
    }

    /// True while any animation still moves (the client may then skip redraws when idle).
    pub fn animating(&self) -> bool {
        self.toast.is_some()
            || !self.scroll_y.settled()
            || !self.enter.settled()
            || self.sel.iter().any(|s| !s.settled())
            || self.row_scroll.iter().any(|s| !s.settled())
    }

    pub fn label(&self, i: usize) -> String {
        match self.items.get(i).map(|i| i.kind) {
            Some(Kind::Profile(p)) => PROFILES[p].0.to_string(),
            Some(Kind::AddUser) => "Add user".into(),
            Some(Kind::Power) => "Power".into(),
            Some(Kind::Avatar) => "Profile".into(),
            Some(Kind::TopIcon(k)) => TOP_ICONS[k].0.into(),
            Some(Kind::Tab(k)) => TABS[k].into(),
            Some(Kind::Tile(t, _)) => t.title.into(),
            Some(Kind::Card(k)) => GAMES[k].title.into(),
            Some(Kind::Btn(l, _)) | Some(Kind::OverlayItem(l)) | Some(Kind::Round(_, l)) => l.into(),
            Some(Kind::Achv(k)) => ACHIEVEMENTS[k].0.into(),
            None => String::new(),
        }
    }

    /// JSON snapshot for tests and the proof scripts.
    pub fn state_json(&self) -> String {
        let (row, col) = self.items.get(self.focus).map_or((-1, 0), |i| (i.row.map_or(-1, |r| r as i32), i.col));
        format!(
            "{{\"shell\":\"{}\",\"screen\":\"{}\",\"tab\":{},\"page\":{},\"overlay\":{},\"guide\":{},\"focus\":{},\"label\":\"{}\",\"row\":{},\"col\":{},\"items\":{},\"toast\":\"{}\"}}",
            self.shell.name(),
            if self.screen == Screen::Login { "login" } else { "home" },
            self.tab,
            self.page.map_or(-1, |p| p as i32),
            self.overlay,
            self.guide,
            self.focus,
            self.label(self.focus).replace('"', ""),
            row,
            col,
            self.items.len(),
            self.toast_text().unwrap_or("").replace('"', "")
        )
    }

    // ---------------------------------------------------------------- drawing

    /// Current on-screen rectangles of every item (tile rows animate: the selected tile grows and pushes neighbours).
    fn positions(&self) -> Vec<Rect> {
        let slide = (1.0 - self.enter.v) * 28.0;
        let mut out: Vec<Rect> = self
            .items
            .iter()
            .map(|it| if it.fixed { it.rect } else { it.rect.moved(0.0, -self.scroll_y.v + slide) })
            .collect();
        for (r, meta) in self.rows.iter().enumerate() {
            let idx: Vec<usize> = (0..self.items.len()).filter(|&i| self.items[i].row == Some(r)).collect();
            let dims: Vec<(f32, f32)> = idx.iter().map(|&i| meta.style.dims(self.sel[i].v)).collect();
            let xs = row_xs(&dims.iter().map(|d| d.0).collect::<Vec<_>>(), meta.style.gap());
            for (k, &i) in idx.iter().enumerate() {
                out[i] = Rect::new(ROW_X0 - self.row_scroll[r].v + xs[k], meta.top - self.scroll_y.v + slide, dims[k].0, dims[k].1);
            }
        }
        out
    }

    pub fn frame_quads(&mut self) -> Vec<Quad> {
        let th = Theme::of(self.shell);
        let pos = self.positions();
        self.hit = pos.clone();
        let mut p = Painter::new(&self.advances);
        p.fill(Rect::new(0.0, 0.0, W, H), th.bg1, th.bg0, 0.0);
        p.glow(Rect::new(-500.0, -600.0, 1900.0, 1500.0), th.glow0);
        p.glow(Rect::new(900.0, 300.0, 1700.0, 1300.0), th.glow1);
        if self.screen == Screen::Login {
            self.draw_login(&mut p, &th, &pos);
        } else {
            self.draw_home(&mut p, &th, &pos);
        }
        self.draw_hints(&mut p, &th);
        if self.guide {
            self.draw_guide(&mut p, &th);
        }
        if self.overlay {
            self.draw_overlay(&mut p, &th, &pos);
        }
        if let Some((m, t)) = &self.toast {
            let a = (t / 0.4).min(1.0);
            let w = p.text_width(m, 28.0) + 64.0;
            let r = Rect::new((W - w) * 0.5, 920.0, w, 56.0);
            p.shadow(r, alpha(rgb(0x000000), 0.35 * a), 24.0, 28.0);
            p.solid(r, alpha(if self.shell == Shell::Ps { th.surface_hi } else { rgb(0x322826) }, a), 28.0);
            p.text(r.x + 32.0, r.y + 11.0, 28.0, alpha(rgb(0xF1DFDB), a), m);
        }
        p.quads
    }

    pub fn frame(&mut self) -> Vec<f32> {
        let q = self.frame_quads();
        let mut v = Vec::with_capacity(q.len() * QUAD_FLOATS);
        for x in &q {
            v.extend_from_slice(&x.to_floats());
        }
        v
    }

    fn clock_text(&self) -> String {
        format!("{:02}:{:02}", self.clock / 60, self.clock % 60)
    }

    fn avatar(&self, p: &mut Painter, th: &Theme, r: Rect, prof: usize) {
        let seed = PROFILES[prof].1;
        p.art(r, seed, hsv(seed * 0.137, 0.6, 0.78), hsv(seed * 0.137 + 0.1, 0.65, 0.34), r.w * 0.5);
        if prof == 0 {
            p.icon(r.inset(r.w * 0.2), IC_OWNER, [1.0; 4], 0.0);
        } else {
            let s = PROFILES[prof].0.chars().next().unwrap_or('?').to_string();
            p.text_center(r.cx(), r.cy() - r.h * 0.3, r.h * 0.56, rgb(0xFFFFFF), &s);
        }
        let _ = th;
    }

    fn focus_ring(&self, p: &mut Painter, th: &Theme, r: Rect, t: f32, radius: f32) {
        if t > 0.02 {
            p.ring(r.inset(-5.0), alpha(th.accent, t), 4.0, radius + 5.0);
        }
    }

    fn draw_login(&self, p: &mut Painter, th: &Theme, pos: &[Rect]) {
        p.text_center(W * 0.5, 190.0, 68.0, th.text, "Welcome Back");
        p.text_center(W * 0.5, 282.0, 30.0, th.dim, "Who is using this console?");
        p.text_right(W - 96.0, 44.0, 30.0, th.dim, &self.clock_text());
        p.text(96.0, 44.0, 30.0, th.dim, "gamescope");
        for (i, it) in self.items.iter().enumerate() {
            let t = self.sel[i].v;
            let r = pos[i];
            match it.kind {
                Kind::AddUser => {
                    let r = r.scaled(lerp(1.0, 1.15, t));
                    p.solid(r, mix(th.surface, th.surface_hi, t), r.w * 0.5);
                    p.icon(r.inset(r.w * 0.3), IC_PLUS, th.text, 0.0);
                    self.focus_ring(p, th, r, t, r.w * 0.5);
                    p.text_center(r.cx(), r.y + r.h + 24.0, 28.0, mix(th.dim, th.text, t), "Add user");
                }
                Kind::Profile(k) => {
                    let r = r.scaled(lerp(1.0, 1.25, t));
                    p.shadow(r.moved(0.0, 14.0), alpha(rgb(0x000000), th.shadow * t), 36.0, r.w * 0.5);
                    self.avatar(p, th, r, k);
                    self.focus_ring(p, th, r, t, r.w * 0.5);
                    p.text_center(r.cx(), r.y + r.h + 24.0, 30.0, mix(th.dim, th.text, t), PROFILES[k].0);
                }
                Kind::Power => {
                    let r = r.scaled(lerp(1.0, 1.15, t));
                    p.solid(r, mix(th.surface, th.surface_hi, t), r.w * 0.5);
                    p.icon(r.inset(r.w * 0.26), IC_POWER, th.text, 0.0);
                    self.focus_ring(p, th, r, t, r.w * 0.5);
                    p.text_center(r.cx(), r.y + r.h + 20.0, 24.0, alpha(th.dim, t), "Power");
                }
                _ => {}
            }
        }
    }

    fn draw_home(&self, p: &mut Painter, th: &Theme, pos: &[Rect]) {
        let ea = self.enter.v;
        // Content first, chrome on top so scrolled rows slide under the bar.
        if self.shell == Shell::Ps {
            self.draw_ps_header(p, th, pos);
        }
        for (i, it) in self.items.iter().enumerate() {
            if !it.fixed || matches!(it.kind, Kind::Round(..)) {
                self.draw_item(p, th, i, pos[i], ea);
            }
        }
        if self.shell == Shell::Ps && self.page.is_none() {
            self.draw_tab_extras(p, th, pos);
        }
        if self.shell == Shell::Switch && self.page.is_some() {
            self.draw_tab_extras(p, th, pos);
        }
        // Chrome.
        if self.shell == Shell::Ps {
            p.fill(Rect::new(0.0, 0.0, W, 150.0), th.bg0, th.bg0, 0.0);
            p.fill(Rect::new(0.0, 150.0, W, 50.0), th.bg0, alpha(th.bg0, 0.0), 0.0);
        }
        for (i, it) in self.items.iter().enumerate() {
            if it.fixed && !matches!(it.kind, Kind::Round(..)) {
                self.draw_item(p, th, i, pos[i], 1.0);
            }
        }
        if self.shell == Shell::Switch {
            self.draw_status_bar(p, th);
        }
    }

    fn draw_ps_header(&self, p: &mut Painter, th: &Theme, pos: &[Rect]) {
        // Big title of the focused tile in the first row of the Games tab.
        if self.tab == 0 && self.page.is_none() {
            let f = self.items.get(self.focus).and_then(|i| match i.kind {
                Kind::Tile(t, _) if i.row == Some(0) => Some(t),
                _ => None,
            });
            let t = f.unwrap_or(&GAMES[0]);
            let y = 190.0 - self.scroll_y.v;
            p.text(ROW_X0, y, 64.0, th.text, t.title);
            p.text(ROW_X0, y + 84.0, 28.0, th.dim, t.sub);
            let w = p.text_width("Open source", 22.0) + 32.0;
            p.solid(Rect::new(ROW_X0, y + 140.0, w, 38.0), th.surface_hi, 19.0);
            p.text(ROW_X0 + 16.0, y + 146.0, 22.0, th.text, "Open source");
        } else if self.tab == 1 {
            let y = 190.0 - self.scroll_y.v;
            p.text(ROW_X0, y, 56.0, th.text, "Media");
            p.text(ROW_X0, y + 76.0, 28.0, th.dim, "Open creative tools and video");
        }
        let _ = pos;
    }

    fn draw_tab_extras(&self, p: &mut Painter, th: &Theme, pos: &[Rect]) {
        match self.page.unwrap_or(self.tab) {
            0 | 1 => {
                for (r, meta) in self.rows.iter().enumerate() {
                    let heading = match (self.page.unwrap_or(self.tab), r) {
                        (0, 0) => "Library",
                        (0, 1) => "All apps",
                        (0, _) => "Explore",
                        (_, 0) => "Craft apps",
                        _ => "TV and video",
                    };
                    p.text(ROW_X0, meta.top - self.scroll_y.v - 56.0 + (1.0 - self.enter.v) * 28.0, 30.0, th.dim, heading);
                }
            }
            2 => self.draw_store_panel(p, th, pos),
            _ => self.draw_ach_summary(p, th),
        }
    }

    fn draw_store_panel(&self, p: &mut Painter, th: &Theme, _pos: &[Rect]) {
        let g = &GAMES[self.store_sel];
        let x = 1420.0;
        p.text(96.0, 170.0, 52.0, th.text, "Store");
        p.text(x, 240.0, 48.0, th.text, g.title);
        p.text(x, 306.0, 28.0, th.dim, g.sub);
        let mut cx = x;
        for l in ["Linux", "Windows", "Web"] {
            let w = p.text_width(l, 22.0) + 32.0;
            p.solid(Rect::new(cx, 372.0, w, 38.0), th.surface_hi, 19.0);
            p.text(cx + 16.0, 378.0, 22.0, th.text, l);
            cx += w + 12.0;
        }
        p.text(x, 450.0, 26.0, th.dim, "Free and open source.");
        p.text(x, 488.0, 26.0, th.dim, "Sample catalog entry.");
        p.text(x, 610.0, 40.0, th.text, "Free");
    }

    fn draw_ach_summary(&self, p: &mut Painter, th: &Theme) {
        p.text(96.0, 170.0, 52.0, th.text, "Achievements");
        let mut x = 1100.0;
        for tier in 0..3u8 {
            let total = ACHIEVEMENTS.iter().filter(|a| a.2 == tier).count();
            let done = ACHIEVEMENTS.iter().filter(|a| a.2 == tier && a.3 >= 100).count();
            let (b, l) = tier_colors(tier);
            p.medal(Rect::new(x, 160.0, 72.0, 72.0), b, l, tier as f32);
            p.text(x + 88.0, 160.0, 34.0, th.text, &format!("{done}/{total}"));
            p.text(x + 88.0, 202.0, 22.0, th.dim, TIER_NAMES[tier as usize]);
            x += 240.0;
        }
        let earned = ACHIEVEMENTS.iter().filter(|a| a.3 >= 100).count();
        p.text(96.0, 240.0, 26.0, th.dim, &format!("{earned} of {} earned (sample data)", ACHIEVEMENTS.len()));
    }

    fn draw_status_bar(&self, p: &mut Painter, th: &Theme) {
        let name = PROFILES[self.profile].0;
        p.text(184.0, 56.0, 32.0, th.text, name);
        if let Some(pg) = self.page {
            p.text_center(W * 0.5, 52.0, 36.0, th.text, TABS[pg]);
        }
        let mut right = W - 96.0;
        // Battery: outline, fill, tip.
        let b = Rect::new(right - 56.0, 62.0, 52.0, 26.0);
        p.ring(b, th.text, 3.0, 7.0);
        p.solid(Rect::new(b.x + 5.0, b.y + 5.0, 34.0, 16.0), th.text, 3.0);
        p.solid(Rect::new(b.x + b.w + 1.0, b.y + 8.0, 4.0, 10.0), th.text, 2.0);
        right -= 80.0;
        p.icon(Rect::new(right - 36.0, 56.0, 40.0, 40.0), IC_WIFI, th.text, 0.0);
        right -= 64.0;
        p.text_right(right, 54.0, 34.0, th.text, &self.clock_text());
    }

    fn draw_hints(&self, p: &mut Painter, th: &Theme) {
        let hints: [(&str, &str); 3] = [("Tab", "Options"), ("Enter", "OK"), ("Esc", "Back")];
        let mut right = W - 96.0;
        for (key, label) in hints.iter().rev() {
            let lw = p.text_width(label, 26.0);
            p.text(right - lw, 1012.0, 26.0, th.dim, label);
            right -= lw + 12.0;
            let kw = p.text_width(key, 22.0) + 24.0;
            p.solid(Rect::new(right - kw, 1010.0, kw, 36.0), th.surface_hi, 18.0);
            p.text(right - kw + 12.0, 1015.0, 22.0, th.text, key);
            right -= kw + 36.0;
        }
    }

    fn draw_guide(&self, p: &mut Painter, th: &Theme) {
        let r = Rect::new(W - 96.0 - 560.0, 520.0, 560.0, 380.0);
        p.shadow(r, alpha(rgb(0x000000), th.shadow), 40.0, 28.0);
        p.solid(r, th.surface, 28.0);
        p.text(r.x + 36.0, r.y + 28.0, 36.0, th.text, "Guide");
        let lines = [
            "Arrow keys or D-pad: move focus",
            "Enter or A: select",
            "Esc or B: back",
            "Q and E or L1 and R1: change tab",
            "Tab or Y: show or hide this guide",
        ];
        for (i, l) in lines.iter().enumerate() {
            p.text(r.x + 36.0, r.y + 100.0 + i as f32 * 52.0, 26.0, th.dim, l);
        }
    }

    fn draw_overlay(&self, p: &mut Painter, th: &Theme, pos: &[Rect]) {
        p.solid(Rect::new(0.0, 0.0, W, H), alpha(rgb(0x000000), 0.5), 0.0);
        let panel = Rect::new(W - 96.0 - 440.0, 120.0, 440.0, 330.0);
        p.shadow(panel, alpha(rgb(0x000000), th.shadow), 40.0, 28.0);
        p.solid(panel, th.surface, 28.0);
        self.avatar(p, th, Rect::new(panel.x + 30.0, panel.y + 30.0, 80.0, 80.0), self.profile);
        p.text(panel.x + 130.0, panel.y + 40.0, 36.0, th.text, PROFILES[self.profile].0);
        p.text(panel.x + 130.0, panel.y + 86.0, 24.0, th.dim, "Signed in");
        for (i, it) in self.items.iter().enumerate() {
            if let Kind::OverlayItem(l) = it.kind {
                let t = self.sel[i].v;
                let r = pos[i];
                p.solid(r, mix(th.surface_hi, th.accent, t * 0.9), 32.0);
                p.text(r.x + 28.0, r.y + 15.0, 30.0, mix(th.text, th.on_accent, t), l);
            }
        }
    }

    fn scrim(p: &mut Painter, r: Rect, radius: f32, a: f32) {
        let r = Rect::new(r.x, r.y + r.h * 0.45, r.w, r.h * 0.55);
        p.fill(r, [0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.7 * a], radius);
    }

    fn draw_item(&self, p: &mut Painter, th: &Theme, i: usize, r: Rect, a: f32) {
        let it = &self.items[i];
        let t = self.sel[i].v;
        if r.x > W + 60.0 || r.x + r.w < -60.0 {
            return;
        }
        match it.kind {
            Kind::Avatar => {
                self.avatar(p, th, r.scaled(lerp(1.0, 1.1, t)), self.profile);
                self.focus_ring(p, th, r, t, r.w * 0.5);
            }
            Kind::Tab(k) => {
                if t > 0.01 {
                    p.solid(r, alpha(th.surface_hi, t), 28.0);
                }
                let on = k == self.tab;
                let col = if on { th.text } else { mix(th.dim, th.text, t) };
                p.text(r.x + 20.0, r.y + 10.0, 34.0, col, TABS[k]);
                if on {
                    p.solid(Rect::new(r.x + 20.0, r.y + r.h - 4.0, r.w - 40.0, 4.0), th.accent, 2.0);
                }
            }
            Kind::TopIcon(k) => {
                p.solid(r, alpha(mix(th.surface, th.surface_hi, t), 0.7 + 0.3 * t), r.w * 0.5);
                p.icon(r.inset(r.w * 0.24), TOP_ICONS[k].1, th.text, 0.0);
                self.focus_ring(p, th, r, t, r.w * 0.5);
            }
            Kind::Tile(tl, style) => self.draw_tile(p, th, r, tl, style, t, a),
            Kind::Card(k) => {
                let g = &GAMES[k];
                let r = r.scaled(lerp(1.0, 265.0 / 257.0, t));
                p.shadow(r.moved(0.0, 10.0), alpha(rgb(0x000000), th.shadow * (0.4 + 0.6 * t) * a), 26.0, 20.0);
                p.art(r, g.seed, hsv(g.seed * 0.137, 0.6, 0.7), hsv(g.seed * 0.137 + 0.12, 0.65, 0.3), 20.0);
                Self::scrim(p, r, 20.0, a);
                p.text(r.x + 22.0, r.y + r.h - 82.0, 32.0, rgb(0xFFFFFF), g.title);
                p.text(r.x + 22.0, r.y + r.h - 40.0, 22.0, alpha(rgb(0xFFFFFF), 0.8), g.sub);
                self.focus_ring(p, th, r, t, 20.0);
            }
            Kind::Btn(label, primary) => {
                let r = r.scaled(lerp(1.0, 1.06, t));
                let (bg, fg) = if primary { (th.accent, th.on_accent) } else { (th.surface_hi, th.text) };
                p.solid(r, bg, r.h * 0.5);
                p.text_center(r.cx(), r.y + 16.0, 30.0, fg, label);
                self.focus_ring(p, th, r, t, r.h * 0.5);
            }
            Kind::Achv(k) => {
                let (title, desc, tier, prog) = ACHIEVEMENTS[k];
                let r = r.scaled(lerp(1.0, 1.03, t));
                p.shadow(r.moved(0.0, 8.0), alpha(rgb(0x000000), th.shadow * 0.5 * (0.3 + t) * a), 22.0, 22.0);
                p.solid(r, alpha(mix(th.surface, th.surface_hi, t), a), 22.0);
                let (b, l) = tier_colors(tier);
                let dim = if prog >= 100 { 1.0 } else { 0.55 };
                p.medal(Rect::new(r.x + 24.0, r.y + 16.0, 88.0, 88.0), alpha(b, dim * a), alpha(l, dim * a), tier as f32);
                p.text(r.x + 136.0, r.y + 14.0, 32.0, alpha(th.text, a), title);
                p.text(r.x + 136.0, r.y + 56.0, 22.0, alpha(th.dim, a), desc);
                let bar = Rect::new(r.x + 136.0, r.y + 94.0, r.w - 136.0 - 140.0, 10.0);
                p.solid(bar, alpha(th.surface_hi, a), 5.0);
                p.solid(Rect::new(bar.x, bar.y, bar.w * prog as f32 / 100.0, bar.h), alpha(th.accent, a), 5.0);
                p.text_right(r.x + r.w - 28.0, r.y + 44.0, 26.0, alpha(th.dim, a), TIER_NAMES[tier as usize]);
                p.text_right(r.x + r.w - 28.0, r.y + 80.0, 22.0, alpha(th.dim, a), &format!("{prog}%"));
                self.focus_ring(p, th, r, t, 22.0);
            }
            Kind::Round(ic, name) => {
                let r = r.scaled(lerp(1.0, 1.14, t));
                p.shadow(r.moved(0.0, 8.0), alpha(rgb(0x000000), th.shadow * 0.6), 20.0, r.w * 0.5);
                p.solid(r, th.surface, r.w * 0.5);
                p.icon(r.inset(r.w * 0.26), ic, th.text, 0.0);
                self.focus_ring(p, th, r, t, r.w * 0.5);
                p.text_center(r.cx(), r.y + r.h + 22.0, 28.0, alpha(th.text, t), name);
            }
            _ => {}
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn draw_tile(&self, p: &mut Painter, th: &Theme, r: Rect, tl: &Tile, style: Style, t: f32, a: f32) {
        let radius = if style == Style::Small { 18.0 } else { 22.0 };
        p.shadow(r.moved(0.0, 12.0), alpha(rgb(0x000000), th.shadow * (0.25 + 0.75 * t) * a), 30.0, radius);
        if tl.plate {
            p.solid(r, alpha(th.plate, a), radius);
            p.icon(r.inset(r.w * 0.24), tl.icon.unwrap_or(IC_OWNER), alpha([1.0; 4], a), 0.0);
        } else {
            p.art(r, tl.seed, hsv(tl.seed * 0.137, 0.62, 0.72), hsv(tl.seed * 0.137 + 0.12, 0.66, 0.3), radius);
            if let Some(ic) = tl.icon {
                let s = (r.w * 0.34).min(72.0);
                p.icon(Rect::new(r.x + r.w * 0.5 - s * 0.5, r.y + r.h * 0.5 - s * 0.7, s, s), ic, alpha([1.0; 4], a), 0.0);
            }
        }
        match style {
            Style::Small => {
                self.focus_ring(p, th, r, t, radius);
                p.text(r.x, r.y + r.h + 20.0, 28.0, alpha(th.text, t * a), tl.title);
                p.text(r.x, r.y + r.h + 56.0, 22.0, alpha(th.dim, t * a), tl.sub);
            }
            Style::Streaming => {
                Self::scrim(p, r, radius, a);
                p.text(r.x + 20.0, r.y + r.h - 62.0, 30.0, alpha(rgb(0xFFFFFF), a), tl.title);
                p.text(r.x + 20.0, r.y + r.h - 28.0, 20.0, alpha(rgb(0xFFFFFF), 0.8 * a), tl.sub);
                self.focus_ring(p, th, r, t, radius);
            }
            Style::Wide => {
                Self::scrim(p, r, radius, a);
                p.text(r.x + 22.0, r.y + r.h - 52.0, 28.0, rgb(0xFFFFFF), tl.title);
                if t > 0.02 {
                    p.ring(r.inset(-6.0), alpha(th.accent, t), 7.0, radius + 6.0);
                    p.text(r.x, r.y - 56.0, 36.0, alpha(th.text, t), tl.title);
                }
            }
        }
    }
}

fn tier_colors(tier: u8) -> (Color, Color) {
    match tier {
        0 => (rgb(0xB8733A), rgb(0xF2B98B)),
        1 => (rgb(0x9AA3AE), rgb(0xF4F7FA)),
        _ => (rgb(0xD9A514), rgb(0xFFEE9A)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dir(d: Dir) -> Input {
        Input::Dir(d)
    }

    fn signed_in(shell: Shell) -> App {
        let mut a = App::new(shell);
        a.input(Input::Select); // focus starts on the first profile
        assert_eq!(a.screen(), Screen::Home);
        a
    }

    #[test]
    fn login_starts_on_first_profile_and_arrows_move_between_profiles() {
        let mut a = App::new(Shell::Ps);
        assert_eq!(a.label(a.focus_index()), "Aphrody");
        a.input(dir(Dir::Right));
        assert_eq!(a.label(a.focus_index()), "Guest");
        a.input(dir(Dir::Left));
        a.input(dir(Dir::Left));
        assert_eq!(a.label(a.focus_index()), "Add user");
        a.input(dir(Dir::Down));
        assert_eq!(a.label(a.focus_index()), "Power");
    }

    #[test]
    fn selecting_a_profile_enters_home_with_focus_on_the_first_tile() {
        let a = signed_in(Shell::Ps);
        assert_eq!(a.label(a.focus_index()), "Veloren");
        assert!(a.toast_text().unwrap().contains("Aphrody"));
    }

    #[test]
    fn right_selects_next_tile_and_down_changes_row() {
        let mut a = signed_in(Shell::Ps);
        a.input(dir(Dir::Right));
        assert_eq!(a.label(a.focus_index()), "Xonotic");
        a.input(dir(Dir::Down));
        assert_eq!(a.items()[a.focus_index()].row, Some(1));
        a.input(dir(Dir::Up));
        a.input(dir(Dir::Up));
        assert_eq!(a.label(a.focus_index()), "Games"); // tab bar above the content
    }

    #[test]
    fn selected_tile_grows_from_106_to_181_and_pushes_neighbours() {
        let mut a = signed_in(Shell::Ps);
        for _ in 0..240 {
            a.update(1.0 / 60.0);
        }
        let pos = a.positions();
        let first = a.focus_index();
        assert!((pos[first].w - 181.0).abs() < 0.01);
        assert!((pos[first + 1].w - 106.0).abs() < 0.01);
        let rest_gap = pos[first + 2].x - pos[first + 1].x;
        assert!((rest_gap - 130.0).abs() < 0.01);
        assert!((pos[first + 1].x - (pos[first].x + 181.0 + 24.0)).abs() < 0.01);
    }

    #[test]
    fn tabs_switch_with_shoulder_buttons_and_back_returns_to_tab_bar() {
        let mut a = signed_in(Shell::Ps);
        a.input(Input::NextTab);
        assert_eq!(a.tab(), 1);
        assert_eq!(a.label(a.focus_index()), "Media");
        a.input(Input::NextTab);
        a.input(Input::NextTab);
        assert_eq!(a.tab(), 3);
        a.input(Input::PrevTab);
        assert_eq!(a.tab(), 2);
        assert_eq!(a.label(a.focus_index()), "Store");
        a.input(dir(Dir::Down));
        assert!(matches!(a.items()[a.focus_index()].kind, Kind::Card(_)));
        a.input(Input::Back);
        assert_eq!(a.label(a.focus_index()), "Store");
    }

    #[test]
    fn profile_overlay_traps_focus_and_back_closes_it() {
        let mut a = signed_in(Shell::Ps);
        a.input(dir(Dir::Up)); // nearest item above the first tile is the avatar
        assert_eq!(a.label(a.focus_index()), "Profile");
        a.input(Input::Select);
        assert!(a.overlay_open());
        assert_eq!(a.items().len(), 2);
        a.input(Input::Back);
        assert!(!a.overlay_open());
        assert_eq!(a.label(a.focus_index()), "Profile");
        a.input(Input::Select);
        a.input(Input::Select); // Switch user
        assert_eq!(a.screen(), Screen::Login);
    }

    #[test]
    fn switch_shell_has_tile_row_and_round_menu_and_pages() {
        let mut a = signed_in(Shell::Switch);
        assert_eq!(a.label(a.focus_index()), "Veloren");
        a.input(dir(Dir::Down));
        assert_eq!(a.label(a.focus_index()), "Media");
        a.input(dir(Dir::Right));
        assert_eq!(a.label(a.focus_index()), "Achievements");
        a.input(Input::Select);
        assert_eq!(a.page(), Some(3));
        a.input(Input::Back);
        assert_eq!(a.page(), None);
        assert_eq!(a.label(a.focus_index()), "Achievements");
    }

    #[test]
    fn shell_switch_at_runtime_keeps_the_session() {
        let mut a = signed_in(Shell::Ps);
        a.set_shell(Shell::Switch);
        assert_eq!(a.shell(), Shell::Switch);
        assert_eq!(a.screen(), Screen::Home);
        assert!(a.items().iter().any(|i| matches!(i.kind, Kind::Round(..))));
    }

    #[test]
    fn store_and_achievements_tabs_build_focusable_items() {
        let mut a = signed_in(Shell::Ps);
        a.activate(Action::Tab(2));
        assert_eq!(a.label(a.focus_index()), "Store");
        a.input(dir(Dir::Down));
        assert!(matches!(a.items()[a.focus_index()].kind, Kind::Card(_)));
        a.input(dir(Dir::Right));
        a.input(dir(Dir::Right));
        a.input(dir(Dir::Right));
        assert!(matches!(a.items()[a.focus_index()].kind, Kind::Btn(..)) || matches!(a.items()[a.focus_index()].kind, Kind::Card(_)));
        a.activate(Action::Tab(3));
        assert!(a.items().iter().filter(|i| matches!(i.kind, Kind::Achv(_))).count() == 8);
    }

    #[test]
    fn pointer_hover_focuses_and_click_activates() {
        let mut a = signed_in(Shell::Ps);
        let _ = a.frame_quads();
        let r = a.hit[a.focus_index() + 1];
        a.pointer(r.cx(), r.cy(), false);
        assert_eq!(a.label(a.focus_index()), "Xonotic");
        a.pointer(r.cx(), r.cy(), true);
        assert!(a.toast_text().unwrap().contains("not built"));
    }

    #[test]
    fn every_frame_variant_emits_quads_and_json_state() {
        for shell in [Shell::Ps, Shell::Switch] {
            let mut a = App::new(shell);
            assert!(a.frame().len() > 40 * QUAD_FLOATS);
            a.input(Input::Select);
            assert!(a.frame().len() > 40 * QUAD_FLOATS);
            a.input(Input::Options);
            assert!(a.state_json().contains("\"guide\":true"));
            assert!(a.frame().len() % QUAD_FLOATS == 0);
        }
    }
}
