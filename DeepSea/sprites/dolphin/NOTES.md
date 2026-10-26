# Dolphin sprite — NOTES (v3)

Finley: v2 was **FAT**. v3 is lean/elongated like `refs/dolphin/user_pair_leap.png`.

## In game
`index.html` loads the three 1× PNGs through `DOLPHIN_SPR` (`dolphin_swim.png` frame width **94**, plus the stills as fallback). Replacing those files reskins the dolphin. Swim scale is **0.50** of the 94×28 canvas (~33×11). v2's 0.36 scale on the fatter 84×36 sheet collapsed this needle snout, so the lean body is drawn a little longer and clearly thinner than that ~30×13 sprite. Facing follows movement by flipping the right-facing swim strip. Reef fish advance one frame about every 140ms.

Live dolphins have 4 HP. The rod and spear (and jelly stings) chip that down, then the catch uses the reef-fish path at weight 4. A diver next to a living dolphin presses E to ride (2× underwater speed, hold W at the surface to breach). E again, diver damage, or the dolphin dying drops you off.

## Thickness
- v2 torso ~**16px** tall mid-body (84×36 canvas)
- v3 torso ~**10px** tall mid-body (94×28 canvas) ≈ **62%** of v2 vertical mass
- Longer horizontal stretch for sleek fusiform read

## Kept from v2
Long snout, melon + crease, wet specular clusters, cream belly, falcate dorsal, socketed eye, photo cool-grey palette, selective outline, form dither

## Palette
`#1A2430` outline · `#344454` dark slate · `#647484` steel · `#9CACB8` lit · `#E4EEF4` wet · `#ECECE4` belly

## Outputs (`sprites/dolphin/`)
| File | Size |
|------|------|
| dolphin.png / _8x | 94×28 right |
| dolphin_left.png / _8x | mirror |
| dolphin_swim.png / _8x / .gif | 376×28, 140ms |
| contact_sheet_8x.png | photo + v2 vs v3 + swim |

## Weak spots
- Side flukes still crescent in profile
- Melon crease few px at 1×
- Pec shortened so it doesn’t re-fatten the silhouette
