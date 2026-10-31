# Coordinate Pixel Quest v4.0 — The Great Valley Expansion

**A complete, standalone, GitHub Pages-ready adventure game.** This is a replacement for the previous Coordinate Pixel Quest repository files, **not** a Learning Hub update.

## The adventure

Coordinate Pixel Quest is a student-friendly pixel-art math adventure. Move through Pixel Valley, unlock regions in order, and restore colorful landmarks by choosing the correct cell in an `(X, Y)` grid. Coordinates refer to **cells** (bottom-left cell is `(1,1)`) rather than intersections. The character can walk with WASD, arrow keys, touch controls, or by clicking a destination or quest.

### Existing content preserved

- Meadow, Eastern Wilds, Star Ridge: original 8 restoration quests
- Crystal Canyon: 4 quests with 16×16 grids
- Sky Isles: 3 quests with 20×20 grids
- Moonveil Marsh: 5 quests with 24×24 grids
- Ember Peaks: 5 quests with 28×28 grids and a 32×32 finale

### Two new main regions

| Chapter | Access | Quest artwork | Grids |
| --- | --- | --- | --- |
| Prism Tundra | After restoring the Sunspire | Icicle Compass, Snow Hare Sentinel, Frostlight Cathedral, Aurora Serpent, Prismatic Crossing | 5 × 36×36 |
| Celestial Gardens | After Prismatic Crossing | Star Bloom Meadow, Moon Koi Sanctuary, Comet Dragon, Celestial Orrery, Heart of the Cosmos | 4 × 40×40 and a final 44×44 |

Main regions require their prior chapter gate. Within a region, most landmarks can be done in any order before the final gateway puzzle opens.

### Five new optional smaller areas

These branch **north off the adventure map** and do not block the main story.

| Side region | Opens after | Three restorations | Grid sizes |
| --- | --- | --- | --- |
| Sunflower Glade | Beginning of game | Honeybee Helper, Golden Tulip, Meadow Butterfly | 8×8, 10×10, 12×12 |
| Tidepool Cove | Golden Bridge | Coral Crab, Tidepool Star, Shimmer Seahorse | 10×10, 12×12, 14×14 |
| Clockwork Camp | Sky Lift | First Cogwheel, Clocktower Dial, Pocket Airship | 12×12, 14×14, 16×16 |
| Mushroom Hollow | Dawn Phoenix | Spotted Mushroom, Moon Snail, Lantern Firefly | 14×14, 16×16, 18×18 |
| Frostfire Grotto | Moonstone Causeway | Explorer Torch, Crystal Golem, Snowy Owl Guardian | 16×16, 18×18, 20×20 |

**Total: 50 quests across seven main-story groupings and five optional side areas; 14 achievements.** Side areas contain three shorter quests apiece, unlocked in sequence. Full completion requires every side area, but completing the Heart of the Cosmos finishes the main story even if side areas remain unfinished.

## Painting controls

- Read the shown ordered pair: X → right, Y ↑ up. Select the coordinate *cell*.
- Color palette is circular with direct selection, buttons for previous/next, and click-the-middle cycling.
- Default keyboard color hotkeys: **Q** (previous) and **E** (next). Customize to any A–Z or 0–9 keys inside a puzzle.
- Right-click cycles to the next color; hold Shift to cycle backward. Wheel-scrolling over the palette also rotates colors. Controls can be disabled independently.
- **10×10 focused view** follows the requested coordinate on larger grids; full-artwork mode remains available.
- **Automatic brush option** for 24×24 and larger chooses the requested color while students still must plot the coordinates correctly. Switch it off to require color selection.
- Optional row/column hints highlight coordinates. Hints do not penalize the score.

## Save data / privacy

The existing localStorage key `cpq_pixel_valley_v1` is preserved. Old quests retain **their exact IDs and artwork patterns**, so v1–v3.1 progress and custom color shortcuts remain compatible at the same repository URL, browser and profile. Progress is stored locally—not shared across student devices or browser profiles. Clearing site data can erase progress.

## GitHub upload

1. Download and extract this ZIP.
2. Open the existing `coordinate-pixel-quest` repository.
3. Upload the **7 individual files from inside the extracted folder directly to the repository root**, replacing matching files. `index.html` must stay in the root.
4. Commit changes. GitHub Pages should use the `main` branch `/ (root)`.
5. Reload the existing game website (often `https://jkramer-cloud.github.io/coordinate-pixel-quest/`). If an older version appears, use a hard refresh.

**The Naches Learning Hub does not need new files** if its tile already links to the same game URL.

No external libraries, API keys, logins, or backend are required.


## v5.0 Living World update

- Richer world rendering with enhanced terrain texture, ambient regional particles, brighter landmark halos, and a visible Pip companion.
- New Graphics Quality setting: Low, Standard, or Enhanced.
- New World Animation toggle for devices that need reduced motion or better performance.
- All 50 quests, progress, and existing save compatibility are preserved.
