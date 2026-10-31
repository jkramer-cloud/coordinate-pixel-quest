# Coordinate Pixel Quest — Restore Pixel Valley

An original, browser-based **coordinate adventure** designed for upper elementary and middle school learners. Explore a fading 16-bit-inspired world, restore objects by coloring precise coordinate cells, unlock a river crossing, and restore the Festival of Stars.

**Release:** 1.0.0 — October 31, 2026

## GitHub upload (game repository only)

1. Create a public GitHub repository named **`coordinate-pixel-quest`**.
2. Extract the **Coordinate Pixel Quest GAME** ZIP on your computer.
3. Open the extracted folder and upload **all files inside it** directly to the root of that GitHub repository. Do not upload the ZIP itself and do not place the entire folder inside the repository.
4. Confirm `index.html`, `styles.css`, `data.js`, `game.js`, and `favicon.svg` are in the repository's top level.
5. Open **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then Save.
6. For the Naches Learning Hub GitHub account, the expected URL is:

   `https://jkramer-cloud.github.io/coordinate-pixel-quest/`

   If your GitHub username differs, substitute your username. GitHub Pages deployment can take a short time to publish.

**Important:** This ZIP is **only the playable game**. It does not include or replace the Naches Learning Hub `index.html` or its `activities.json`. The game can be linked from the Hub in a separate Hub update.

## Gameplay

- Walk with WASD or the arrow keys, use the on-screen directional pad, or click/tap map tiles to move automatically.
- Click/tap a glowing landmark or choose its entry in the quest log to travel toward it.
- When a paint challenge opens, read the requested **(X, Y)** cell and color name.
- Select the matching brush color, then choose the correct square. A correct square gives **4 XP**; wrong answers can be retried without losing XP.
- Optional hints highlight the entire target row and column. They are free and never block progression.
- Color every required square to complete a restoration and claim its completion XP.
- Restore the first three meadow landmarks, rebuild the Golden Bridge, then cross east to finish the remaining quests.
- Explore for six hidden star collectibles (+20 XP apiece).
- Check the Gallery for saved art, partial work, and six achievements.

## Coordinate convention (important for teaching)

**Paint-by-coordinate mode uses cell addresses, not Cartesian grid intersections.**

- The bottom-left **square** is `(1, 1)`.
- X increases to the **right**; Y increases **upward**.
- The first puzzle grids are 8×8, then 10×10 and 12×12.
- The optional **Map grid** uses the same bottom-left cell-address convention. It labels world tiles starting from `(1, 1)`.

This creates foundational ordered-pair fluency, but it is **not** a replacement for formal coordinate-plane point plotting or four-quadrant Cartesian graphing. A future chapter could add these separately.

## Eight restoration quests

| Quest | Grid | Unlock condition |
|---|---:|---|
| Sun Lantern | 8×8 | Available at the start |
| Blooming Oak | 8×8 | Available at the start |
| Friendly Automaton | 10×10 | Available at the start |
| Golden Bridge | 10×10 | All three meadow quests |
| River Skiff | 10×10 | Golden Bridge |
| Hilltop Windmill | 10×10 | Golden Bridge |
| Starlight Portal | 12×12 | River Skiff + Hilltop Windmill |
| Festival of Stars | 12×12 | Starlight Portal |

There are **432 required colored squares** across the full adventure. Students can save partial work across sessions.

## Autosave and privacy

Progress is stored in the browser's `localStorage` on the device and browser profile used to play. It records completed puzzle cells, quest completion, XP, mistake counts, hints, and discovered stars. It does **not** ask for names, accounts, or personal information, and has **no server or external tracking**.

Progress does **not** sync between school Chromebooks and home devices; clearing browser data or using private/incognito mode can remove it. The Settings menu offers a reset button with a confirmation dialog. For classroom use, have students use the same browser profile to keep their progress.

## Project structure

- `index.html` — the complete game page and accessible UI
- `styles.css` — responsive retro-adventure layout and pixel palette
- `data.js` — the eight original artwork patterns and restoration quests
- `game.js` — movement, exploration, painting, quest unlocks, autosave, and gallery
- `favicon.svg` — custom game icon
- `README.md` — this file

There is no build step, dependency installation, API key, external font, or paid asset. The site can be hosted directly on GitHub Pages.

## Teacher notes / next directions

- The initial 8×8 puzzles introduce coordinates before larger grids require more careful counting.
- Wrong answers receive immediate formative feedback; students may use hints without penalties.
- The world objective motivates accuracy and persistence through the completed artwork, a restored environment, and unlocked map regions.
- Candidate future upgrades: a four-quadrant coordinate chapter, symmetry and transformations, student-designed pixel art, printable coordinate challenge sheets, and more quest regions.

All visual art and game data were built specifically for this project.
