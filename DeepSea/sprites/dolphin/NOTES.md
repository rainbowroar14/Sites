# Dolphin sprite — NOTES

Bottlenose dolphin (*Tursiops*) side-view for Finley's Deep Sea tropical lagoon.
The game loads the three 1× PNGs below (`dolphin_swim.png` frame width 72, plus the stills as fallback). Swim scale is about 0.42 of native so a dolphin reads larger than the shrunk clownfish. Facing follows movement by flipping the right-facing swim strip. Hook, spear, rope, deck, and feed use the reef-fish path; weight is 4.

## Refs
- `refs/dolphin/dolphin_side_clean.jpg` — primary side/jump profile
- `refs/dolphin/dolphin_wiki.jpg` — surfacing silhouette / proportions
- `refs/dolphin/dolphin_side.jpg` — underwater wet look / caustics
- (discarded bad downloads: dog/humpback mislabeled files left on disk unused)

## Light
- Direction: **top-left**
- Hue-shift: shadows → blue-purple; highlights → cyan; belly pale cool grey
- Selective outline: navy (`#161C30`) on shadow/trailing/bottom; shadow-blue (`#344462`) on lit tops

## Palette (6)
| Role | Hex | RGBA |
|------|-----|------|
| outline | `#161C30` | (22, 28, 48, 255) |
| shadow | `#344462` | (52, 68, 98, 255) |
| base | `#667A90` | (102, 122, 144, 255) |
| light | `#94AAC0` | (148, 170, 192, 255) |
| high (wet) | `#C4DEEC` | (196, 222, 236, 255) |
| belly | `#DCE6EE` | (220, 230, 238, 255) |

## Outputs (`sprites/dolphin/`)
| File | Size | Notes |
|------|------|-------|
| dolphin.png / _8x | 72×34 | Right-facing still |
| dolphin_left.png / _8x | 72×34 | Mirror |
| dolphin_swim.png / _8x | 288×34 | 4-frame strip |
| dolphin_swim.gif | 72×34 | 140ms/frame, loop |
| contact_sheet_8x.png | — | Refs + sprites |

## Animation
- 4 frames: fluke kick ±2px, body S-wave ±1px mid, pec lag ±1px (phase-offset)
- Timing ~140ms/frame (calm swim)

## Weak spots
- At 1× the melon/beak crease is only 1–2px — can still read a bit generic-cetacean/shark-like until 2–3×.
- Fluke lobes are side-view crescents; true horizontal fluke plane is hard at this scale.
- Pec paddle is short by design (readable) vs real dolphin wing length.
- Swim is shear/kick of the still silhouette (parts reused), not fully redrawn per frame.
- No orca eye-patch / white belly cape — uniform cool grey with pale ventral dither only.
