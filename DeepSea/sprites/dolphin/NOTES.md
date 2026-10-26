# Dolphin sprite — NOTES (v2)

Bottlenose (*Tursiops*) side-swim for Finley's Deep Sea lagoon.
**Primary target:** `refs/dolphin/user_pair_leap.png` (Finley leap / heart pose).
Side profile for gameplay; leap photo drives anatomy, proportions, color, wet look.

## In game
`index.html` loads the three 1× PNGs through `DOLPHIN_SPR` (`dolphin_swim.png` frame width **84**, plus the stills as fallback). Replacing those files reskins the dolphin. Swim scale is **0.36** of the 84×36 canvas (~30×13), the same on-screen size as v1's 72×34 sheet at 0.42, so the longer snout does not grow the sprite. Facing follows movement by flipping the right-facing swim strip. Reef fish advance one frame about every 140ms.

Live dolphins have 4 HP. The rod and spear (and jelly stings) chip that down, then the catch uses the reef-fish path at weight 4. A diver next to a living dolphin presses E to ride (2× underwater speed, hold W at the surface to breach). E again, diver damage, or the dolphin dying drops you off.

## What changed vs v1
- Longer, clearer bottlenose rostrum + visible melon→beak crease (bottleneck step)
- Slimmer fusiform body (less diamond-chunky)
- Falcate dorsal mid-back with aft-curved tip
- Photo countershade: thin dark slate dorsal → steel side → pale creamy belly
- Glossy wet speculars as small clusters on melon / back ridge / dorsal leading (not flat bands)
- Longer tapered pec; wider horizontal fluke lobes with notch
- Eye recessed in socket behind mouth corner
- Palette retuned from leap photo greys (cool hue-shift kept)
- Canvas 84×36 (was 72×34) for longer snout
- Swim frames actually differ (wave + kick + pec lag)

## Light
- Direction: **top-left**
- Selective outline: `#1A2430` shadow/trailing/bottom; `#344454` lit tops
- Form dither only at thin zone seams (photo is mostly smooth)

## Palette (6)
| Role | Hex |
|------|-----|
| outline | `#1A2430` |
| dark slate (dorsal) | `#344454` |
| steel mid | `#647484` |
| lit side | `#9CACB8` |
| wet specular | `#E4EEF4` |
| pale belly | `#ECECE4` |

## Outputs
| File | Size |
|------|------|
| dolphin.png / _8x | 84×36 right |
| dolphin_left.png / _8x | mirror |
| dolphin_swim.png / _8x | 336×36 4-frame |
| dolphin_swim.gif | 140ms/frame |
| contact_sheet_8x.png | Finley photo + v1 vs v2 + swim |

## Weak spots
- Side-view flukes still read a bit crescent/V (true horizontal plane is hard in profile).
- Melon crease is only a few pixels — strongest at 2–3× zoom.
- Pec length is shortened vs photo for game readability.
- Leap photo belly faces camera more than pure side; side silhouette also used prior side refs.
