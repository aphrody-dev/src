# Cahier des Charges Technique (PRD) — Yolo Fullstack Framework

| Champ / Field                 | Specification                                                                    |
| :---------------------------- | :------------------------------------------------------------------------------- |
| **Identifiant / Slug**        | `yolo-fullstack-framework`                                                       |
| **Domaine / Surface**         | `yolo.aphrody.com`                                                               |
| **Mode d'Usage (Impeccable)** | `operate`                                                                        |
| **Proprietaire / Owner**      | Aphrody Sovereign Engineering (`contact@aphrody.com`)                            |
| **Couleur Racine (HCT Seed)** | `#1a73e8` (`tonal_spot`)                                                         |
| **Runtime & Verification**    | Bun v1.4.4 Full-Rust, `gds verify`, `gds audit-slop`, Lighthouse / `wck` 100/100 |

## 1. Objectif Produit & Positionnement / Product Scope

Reproducible fullstack Aphrody Bun v1.4.4 framework exploiting Bun.serve, HTMLRewriter SSR CSP nonces, bun:sqlite AST module graph, virtual M3 icon and HCT token plugins, Aphrody Pets WebGPU/Canvas2D companion, and 3-VPS datacenter search telemetry.

- **Frontiere Souveraine (Single AI Ownership)** : `@aphrody/ai-os` demeure l'unique produit IA public du monorepo. Cette surface (`Yolo Fullstack Framework`) expose une interface generaliste sobre, rapide et deterministe inspiree par Linus Torvalds (structures plates), Jarred Sumner (vitesse native zero-dependance) et Larry Page (clarte visuelle immediate).
- **Politique Anti-Slop** : Zero emoji, zero jargon promotionnel genere automatiquement, zero degrade violet-rose generique, zero icone Unicode de substitution.

## 2. Utilisateurs Cibles & Parcours / Target Workflows

1. **Lecture & Orientation (< 100 ms)** : L'utilisateur identifie l'action principale, l'etat courant et la navigation primaire des le premier rendu sans decalage de mise en page (`CLS = 0.00`).
2. **Execution Clavier & Pointeur** : Toutes les commandes critiques disposent d'un raccourci clavier, d'un anneau `:focus-visible` haute visibilite (`2px solid #435e91`) et de cibles tactiles minimales de `40x40px` (desktop) / `48x48px` (mobile).
3. **Resilience d'Etat** : Chaque vue implemente explicitement les 8 etats canoniques : `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading` (squelette geometrique stable), `empty` (action directe de creation) et `error` (diagnostic factuel et action de reprise).

## 3. Architecture de Maquette & Grille Spatiale / Wireframe Specification

```text
+----------------------------------------------------------------------------------+
| TopAppBar (height: 56px, surface-container-low, 1px outline-variant bottom)      |
| [Brand Lockup 24px]   [Primary Context / Search 480px max]   [Theme] [Primary]   |
+--------------------+-------------------------------------------------------------+
| NavigationRail     | Main Stage (max-width: 1280px, padding: 24px, gap: 24px)    |
| (72px compact /    | +---------------------------------------------------------+ |
|  240px expanded)   | | Primary Focal Panel (surface-container-lowest, r=12px)  | |
|                    | | Headline (Space Grotesk 32px/40px) + Action Bar         | |
| - Workspace        | +---------------------------------------------------------+ |
| - Assets           | +---------------------------+-----------------------------+ |
| - Telemetry        | | Data / Inspector Region   | WebGPU / Vector Preview     | |
| - Settings         | | (tabular-nums, 4dp rows)  | (60fps / reduced-motion ok) | |
|                    | +---------------------------+-----------------------------+ |
+--------------------+-------------------------------------------------------------+
```

- **Points de Rupture Responsifs / Breakpoints** :
  - `Compact` : `375px - 599px` (4 colonnes, marges `16px`, gouttieres `12px`, `NavigationBar` inferieure)
  - `Medium` : `600px - 1023px` (8 colonnes, marges `24px`, gouttieres `16px`, `NavigationRail`)
  - `Expanded` : `1024px - 1440px+` (12 colonnes, marges `24px`, gouttieres `24px`, `NavigationDrawer` ou Rail)

## 4. Contraste Perceptuel & Accessibilite / WCAG 2.2 Verification

- **Mode Clair (`#1a1b20` sur `#f9f9ff`)** : Ratio `16.39:1` (WCAG AA: `PASS`, AAA: `PASS`)
- **Mode Sombre (`#e2e2e9` sur `#111318`)** : Ratio `14.41:1` (WCAG AA: `PASS`, AAA: `PASS`)
- **Action Primaire (`#ffffff` sur `#435e91`)** : Ratio `6.46:1` (Delta Tone HCT: `60.01`)

## 5. Budgets de Performance & Criteres d'Acceptation / Lighthouse & WCK 100/100

| Metrique / Gate                     | Cible Stricte              | Commande de Verification    |
| :---------------------------------- | :------------------------- | :-------------------------- |
| **First Contentful Paint (FCP)**    | `<= 600 ms`                | `wck` / Lighthouse          |
| **Largest Contentful Paint (LCP)**  | `<= 1200 ms`               | `wck` / Lighthouse          |
| **Interaction to Next Paint (INP)** | `<= 50 ms`                 | `wck` / Performance         |
| **Cumulative Layout Shift (CLS)**   | `0.00`                     | Metriques `size-adjust` OFL |
| **Conformite Design System**        | `>= 90 / 100`, `0` erreur  | `gds verify`                |
| **Audit Anti-Slop (Prose & CSS)**   | `clean: true`, `100 / 100` | `gds audit-slop`            |
