# Coordinate Pixel Quest — v5.3 Cartesian Coordinates

**GitHub Pages-ready update** built on v5.2, preserving the complete 16-bit pixel world, 50 artwork quests, 12 areas, optional side trails, color wheel, game rules, story, and larger puzzle focus views.

## Classroom math update

- **First two main quests (Sun Lantern and Blooming Oak): Quadrant I practice.** The bold horizontal X-axis is at the *bottom*, the vertical Y-axis is at the *left*, and they meet at the clearly marked **(0, 0)** bottom-left corner. Clickable squares have X and Y labels **1, 2, 3, …**.
- **All other quests, including optional side quests: four-quadrant Cartesian-style grids.** The X-axis ticks appear below the artwork, Y-axis ticks on the left, and the bold zero axes cross at **(0, 0)** near the middle of the artwork. Columns to the left use negative X, rows below use negative Y, and right/up use positive coordinates. The origin is highlighted by 0 ticks and a small marker.
- **Every coordinate prompt, hint, mouse click, progress counter, gallery preview, and 10×10 focus view** now uses the correct coordinates for its puzzle. All existing pixel-art patterns remain unchanged.
- Each graph explicitly labels **X →** and **Y ↑**, its quadrant mode, and the origin location.
- **Grid lines ON/OFF** in the painting toolbar hides interior cell outlines and crossing axes to make colored artwork easier to view, while preserving clickable squares, coordinate labels, and progress.
- Pixel art is colored by *coordinate-labelled squares* (the game's interaction model), rather than mathematical point markers at grid-line intersections. For even-sized four-quadrant artworks, the zero axes pass through the center of the (0, 0) square. This is the game's intentional cell-based adaptation of a Cartesian grid.

## Installation

Extract this ZIP, then copy **all 12 release files** into the root of the existing `coordinate-pixel-quest` GitHub repository, replacing matching files. Do not upload the ZIP or the extra enclosing folder. GitHub Pages should serve `index.html` on the `main` branch from `/ (root)`.

Refresh with **Ctrl+Shift+R** if GitHub Pages still shows the older interface. The release tag should show **CARTESIAN COORDINATES · V5.3**.

## Saves and compatibility

This release deliberately starts a **new local save** under `cpq_pixel_valley_v2`. Any v5.2 progress stored in the same browser is not imported. This avoids mixing the earlier all-positive coordinate scheme with the new signed coordinate puzzle positions. Future progress saves automatically as normal. There are no accounts, external dependencies, trackers, or API keys.
