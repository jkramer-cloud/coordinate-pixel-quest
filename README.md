# Coordinate Pixel Quest — v3.1: Moonveil Marsh & Ember Peaks

A standalone educational coordinate-adventure for GitHub Pages. **Upload the seven files inside this folder to your existing `coordinate-pixel-quest` GitHub repository root.** Do not upload the ZIP itself. `index.html` is the homepage.

## Complete adventure

- **Original valley:** 8 restorations, 8×8 through 12×12 grids.
- **Crystal Canyon:** 4 restorations with 16×16 grids.
- **Sky Isles:** 3 restorations with 20×20 grids.
- **Moonveil Marsh (new):** 5 restorations with 24×24 grids: Moonlit Lily Pad, Lantern Moth, Whispering Willow, Night Owl, Moonstone Causeway.
- **Ember Peaks (new):** 5 restorations: Sleeping Volcano, Crimson Dragon Guardian, Ancient Star Forge and Golden Griffin at 28×28; finale Sunspire of Renewal at 32×32.

**Total: 25 quests and 10 badges.** Reach Moonveil Marsh after completing the Dawn Phoenix. Restore all four marsh landmarks to open the Moonstone Causeway, which grants passage to Ember Peaks. Finish the four Ember guardians to unlock the Sunspire grand finale.

## Larger canvas assistance

On 24×24, 28×28 and 32×32 puzzles, a **10×10 focused view is enabled by default**. Axes always show the original whole-artwork coordinates (1–24, 1–28, or 1–32). You can toggle back to the whole grid. **Automatic brush** (on by default for new larger puzzles) picks the requested color, while the learner must still find the correct X,Y cell. Switch it off to practice identifying colors as well. Row/column hints remain free.

## Controls

WASD or arrow keys, screen direction pad, or click-to-travel on the map. Select a quest in the left log to automatically walk there. Follow the displayed ordered pair in the painting puzzle; X increases to the right and Y increases upward, with the bottom-left *cell* at (1,1).

## Saved progress

Browser localStorage key `cpq_pixel_valley_v1` is unchanged. Previously completed v1 and v2 quests, XP, painted squares, achievements and exploration persist in the same browser and GitHub Pages URL. New quests appear as locked until their chapter gates open. If a class uses shared browsers, remember progress is saved per browser profile rather than by student account. No online account or server is required.

## GitHub Pages setup

1. Extract this ZIP locally.
2. Upload all 7 files to the **root** of `coordinate-pixel-quest`, replacing matching files.
3. Commit, then let GitHub Pages publish the main branch root (usually already enabled).
4. Open `https://YOUR-USERNAME.github.io/coordinate-pixel-quest/` and refresh.

This update changes **game files only**; the existing Learning Hub tile should keep working at the same GitHub Pages address. No third-party JavaScript libraries, API keys or backend required.

## Custom brush controls (v3.1)

The puzzle includes a circular paint palette with individual color swatches, a central **click-to-cycle** button, and **Previous / Next** buttons. Scroll over the wheel to cycle. **Right-click** over the coordinate grid or wheel to cycle to the next color; Shift + right-click reverses. Desktop **Q** is Previous and **E** is Next by default. Click **Customize keys** inside any puzzle, then click a key button and press any single letter A–Z or digit 0–9. Settings persist in the existing local save. Players may disable hotkeys or right-click independently, or use both together. Regular swatches always remain available for touchscreen learners. Selecting a color manually in an advanced puzzle automatically turns automatic brushing off so it cannot replace the player's chosen color. The game's world movement keys remain unchanged outside puzzles.
