# Coordinate Pixel Quest v2.0 — Crystal Canyon & Sky Isles

An original browser-based **paint-by-coordinate adventure** for upper elementary and middle-school students. Explore Pixel Valley, restore landmarks with colored coordinate cells, and progressively open new regions. Version 2 adds **Crystal Canyon** and **Sky Isles**, including 16×16 and 20×20 artwork, accessible 10×10 focus view for large puzzles, and new gates that enforce chapter progression.

**Version:** 2.0.0 — October 31, 2026

## GitHub upload: GAME files only

This is a complete replacement for the **Coordinate Pixel Quest game** repository. It does **not** contain the Naches Learning Hub website files.

1. Extract `COORDINATE_PIXEL_QUEST_GAME_V2_EXPANDED_REGIONS_GITHUB_READY.zip` on your computer.
2. Open your existing GitHub repository `coordinate-pixel-quest` (or create one if needed).
3. Upload **all seven files from inside the extracted folder to the repository root**, replacing older copies with matching names. In particular, replace `index.html`, `data.js`, `game.js`, and `styles.css` together; do not mix old and new versions.
4. Commit the changes. GitHub Pages remains configured to deploy from `main` → `/ (root)`.
5. Typical deployed URL: `https://jkramer-cloud.github.io/coordinate-pixel-quest/`.

**Students' existing local saves are retained:** v2 uses the original `cpq_pixel_valley_v1` storage key and data format. Updates made at the same website URL and within the same browser profile keep the original quest completion, paint progress, XP, and collected stars. Other browsers or devices have different saves.

## What changed from v1

- Expanded the explorable world map horizontally, with two visually distinctive biomes.
- **Crystal Canyon** unlocks only after completing `Festival of Stars` in the original world. Its four quests are 16×16 pixel artworks.
- The **Sky Lift** must be completed after the other three canyon restorations to open the Sky Isles.
- **Sky Isles** offers three 20×20 masterpieces. The last one unlocks after the cloud whale and floating citadel.
- 7 new landmarks, 5 new exploration stars, and 2 additional achievements (8 total).
- A chapter tracker displays progress for the original Valley, Crystal Canyon, and Sky Isles.
- For 16×16 and 20×20 canvases, use the **Focus on a 10×10 area** button for more readable cells and original global X/Y labels. On narrow screens the focus view activates automatically; switch to the whole-artwork view anytime.
- Original gameplay, artwork, quest order, XP, and browser save data are preserved.

## Progression: 15 quests

| Chapter | Restoration | Size | What unlocks it |
| --- | --- | --- | --- |
| Original Valley | Sun Lantern | 8×8 | Start |
| Original Valley | Blooming Oak | 8×8 | Start |
| Original Valley | Friendly Automaton | 10×10 | Start |
| Original Valley | Golden Bridge | 10×10 | Three meadow restorations |
| Original Valley | River Skiff | 10×10 | Golden Bridge |
| Original Valley | Hilltop Windmill | 10×10 | Golden Bridge |
| Original Valley | Starlight Portal | 12×12 | Skiff + Windmill |
| Original Valley | Festival of Stars | 12×12 | Starlight Portal |
| **Crystal Canyon** | Heart of the Canyon | **16×16** | Festival of Stars |
| **Crystal Canyon** | Canyon Fox Guardian | **16×16** | Festival of Stars |
| **Crystal Canyon** | Canyon Observatory | **16×16** | Festival of Stars |
| **Crystal Canyon** | Sky Lift | **16×16** | Three canyon restorations |
| **Sky Isles** | Whale of the Clouds | **20×20** | Sky Lift |
| **Sky Isles** | Floating Citadel | **20×20** | Sky Lift |
| **Sky Isles** | Dawn Phoenix | **20×20** | Cloud Whale + Citadel |

**Totals:** 15 restorations / 1,443 painted coordinate cells, including the original game's 433 cells and 1,010 new cells.

## How students play

- Move with WASD/arrow keys, on-screen directional buttons, or click/tap world tiles to walk.
- Select a glowing landmark or use the quest log to travel toward a restoration.
- Paint the requested **cell** by choosing its color and its ordered pair `(X, Y)`. Students earn 4 XP per correct cell and an additional reward when each artwork is finished.
- Use row/column hints for support, and the focus view for larger artworks. Incorrect attempts can be retried without XP loss.
- Find eleven hidden exploration stars, check restored art in the Gallery, and earn eight badges.
- Progress saves after each correct coordinate.

### Coordinate convention for teachers

This is **cell-address coordinate art**, not point plotting on a Cartesian graph. The bottom-left **square** is `(1,1)`; X increases right and Y increases upward. All axis labels in focus view remain **global coordinates** from the full artwork, even when the view shows only a 10×10 subsection. Four-quadrant point plotting is not included in v2.

## Save data and student privacy

Only local browser storage is used. No accounts, student names, remote servers, analytics, or personal data are collected. Browser-saved progress does not sync between devices or browser profiles; clearing site data or switching to incognito/private mode can remove progress. Use the same deployed site and browser profile to continue saved work. Settings → Reset progress erases the local save after confirmation.

## Package files

- `index.html` — complete game webpage
- `styles.css` — responsive map, puzzle, and chapter interface
- `data.js` — original and added pixel patterns, artwork colors, quest dependencies
- `game.js` — exploration, gates, painting, autosave, unlock progression
- `favicon.svg` — browser tab icon
- `README.md` — setup and teaching notes
- `CHANGELOG.md` — version history

All game assets are self-contained. No build process, API key, external library, or network connection is required once the files are hosted.
