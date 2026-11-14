# License queue (human decisions)

Agents do not decide licensing. They download, extract, absorb, code, build, redesign and deploy, and append every license or trademark question here for a human. Work never waits on this file.

Entry format, one row per item:

| Date | Item | Where it is used | Source and stated license | Question for the human | Status |
| ---- | ---- | ---------------- | ------------------------- | ---------------------- | ------ |

Status values: `open` (default), `cleared` (human approved), `refused` (human refused: remove it).

Deploy rule: items with status `open` are built and tested like all others; a manifest field `license_status` carries the value so a human can flip it. No agent flips `open` to `cleared` or `refused`.

| Date       | Item                                                                                                                | Where it is used                                          | Source and stated license                                          | Question for the human                          | Status |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- | ------ |
| 2026-11-13 | Console reference mockups (PlayStation-style Gamescope.fig, Switch-style consolde.fig, mobile.fig, Switch 2 UI png) | docs/design/replica/console (text only), design reference | Third-party Figma community files, license not checked             | May layouts, states and any art from them ship? | open   |
| 2026-11-13 | Vendor favicons (Steam, Xbox, PlayStation, Epic, GOG, F-Droid, Google Play, Bevy, ArtCraft, EmulatorJS, Windows)    | assets/library/icons/vendors, store, home cards           | Fetched from each product site, trademark owners in ATTRIBUTION.md | Nominative use acceptable on public sites?      | open   |
| 2026-11-13 | Game cover art hotlinked from vendor CDNs                                                                           | apps/aphrody games index                                  | Steam/Epic CDNs                                                    | Hotlinking acceptable?                          | open   |
| 2026-11-13 | Owner logos imported from Pictures/logo (Google Sans Flex wordmark, Google brand colours in loader)                 | assets/brand/src/owner                                    | Owner supplied                                                     | Fonts and colours cleared for public use?       | open   |
