# Eldervale 1.2 — exploration and combat revision

Android portrait remains the primary surface. English copy, readable type, masked large portraits, natural gameplay sprites and nature/Foley audio only remain requirements.

## Intended behavior

- Native atlas attack, bow, run and spin poses. Strikes land on the animation's contact frame. Dodge uses a fast grounded run, fading afterimages and dust.
- One contextual icon above the right combat buttons: Talk, Open, Gather, Enter, Rest or Restore. No NPC names over sprites. Exits activate on walking through them.
- A compact top HUD, optional small compass and minimap. Quest changes appear briefly; quest details live in the Journal. Chest loot uses an unobtrusive receipt next to the right controls.
- Analog inner joystick walks, outer joystick runs. Independent movement/action touches remain supported.
- Twenty-seven outdoor areas and thirty furnished houses. Six towns across village, canal, copperworks and snow-refuge districts; branching forest roads, causeways and mountain routes; dungeon chambers with three ward stones before guardian entrances.
- Guardians appear only after the approach dungeon and an arena threshold, with a short in-world reveal. No early boss at the third region.
- Forty-three items, explicit enemy and chest probabilities in the Codex, actual rolls using the same tables as the displayed rates.
- Quest selection can track the next NPC, object, ward, enemy or exit. Route guidance traverses the region graph and directs the player to missing wards before a guardian entrance.
- Replace harsh synthetic ambience with softly mastered CC0 field recordings of birds, river and wind. Preserve offline audio and background suspension.

## Implementation and validation

1. Add authored region, house, loot and guidance data; keep version-1 saves readable.
2. Replace layouts and rendering with per-region dimensions, ground tiles, rooms, water, bridges and furnishings. Verify reachable interaction points and exits.
3. Implement combat timing, effects, context actions, running and automatic travel.
4. Rework HUD, journal tracking, atlas pagination and drop-rate sheets.
5. Package furniture art and field recordings with source/prompt manifests.
6. Verify unit progression, graph/route reachability, touch gameplay, interiors, wards, boss reveals, campaign, offline rendering and Android release artifacts.

Source game assets in `E:\Roguelike Opus 55` are read-only inputs. Existing Android upload signing material is preserved.
