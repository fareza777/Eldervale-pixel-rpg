# Eldervale v1.3 — Homes, combat and the story behind the dawn

Version 1.3.0 / Android code 4. Existing version-1 journeys remain compatible.

## Homes and travel

All 30 interiors use distinct archive, inn, home, shop, smith and alchemist
arrangements. Furnishings are cropped to their visible silhouettes, keep their
proportions, and use the actual lowest visible pixel as the floor anchor.
Contact shadows sit at that anchor. Layout validation checks the rendered
silhouette bounds of every pair of standing furnishings.

Rooms have wooden flooring, skirting, recessed windows and a southern doorway.
An integer 2× camera scale keeps sprite pixels consistent. Rugs sit
on the floor beneath actors. Tall furniture, tables, chairs and work benches
have separate positions and usable space between them.

House interactions follow the door drawn in the original building sprite,
including its horizontal offset. Face that door for the right-hand **Enter**
button. Region exits sit at road ends and activate on foot. Entrances have no
circles or floating markers.

Forty restrained surface variants add coherent stone, soil, wood, snow and
water detail. Continuous, gently irregular road contours replace square soil
and grass boundaries. Tree bases have small soil patches, roots and sparse
grass; shorelines and town doorsteps retain subtle edges.
Moonblooms and botanical decoration use six new transparent cutouts with
ivory, lilac, dry gold and muted blue-gray tones, removing square green bases.
Furniture and flora were refined again after a phone preview showed lost
detail. The current atlases store twice the world resolution and render at
half scale, with clean binary alpha edges and no fuzzy authoring halos.

Town residents take short, slow walks around their usual places, using the
original direction-specific sprite animations. They avoid walls, furniture,
water and each other. Approaching residents stop and face the player before
the right-hand **Talk** action becomes available. Quest guidance, interaction
positions, ground shadows and small quest symbols follow the moving actor.
Names appear in dialogue. Indoor service NPCs remain at their work stations.

## Combat

Attacks use the existing animated sprite frames at 18 fps. Warden strikes have
a small collision-aware step. A late tap buffers the next attack. Dodge and
opening a menu cancel uncommitted attacks, so a cancelled swing cannot damage
an enemy later. Launched projectiles keep their normal behavior.

Hits briefly stagger ordinary enemies, apply limited collision-aware recoil,
flash the target and play impact Foley. Bosses have restrained recoil and keep
their windup rules. Enemy charge movement is interpolated instead of jumping
to the destination. Contact shadows follow recoil on the same frame. Rapid
damage numbers combine briefly to remain readable.

Signature skills use a measured wave, sparks and the class's own animation.
Three short voice variations per class rotate with at least ten seconds between
calls. Narrative speech has priority over skill calls.

## Narrative and presentation

Four illustrated prologue scenes introduce the empty second cup, the lantern,
the erased archives and Lyra. Scenes advance after narration and reading time,
or through **Continue**. **Skip** enters the game immediately. Replay is in
Menu and About. No illustrated character exposes a face.

NPC dialogue changes with campaign progress. The discoveries connect selected
memory loss, Mara's past decisions, the player's missing choice and Lyra's
burden. The Hollow King reveal gives the final expedition a different meaning.
Community quests support the third ending. Six unlocked chronicle chapters
and three recovered memory pages let players revisit the story in short pages.

Dialogue uses a compact masked portrait, speaker nameplate, readable subtitles,
line progress, voice replay and distinct service/quest choices. The final three
decisions have their own panel. Settings is divided into Audio, Comfort and
Challenge so the phone view stays compact.

The sleeping world canvas retains its full phone layout behind the title
screen. Keyboard resize and Android Back can therefore leave and return to
menus without reducing that canvas to a one-pixel surface.

## Reusable art and offline voice

The built-in **image_gen** tool generated the cinematic atlas and transparent
flora source. Exact prompts and saved/derived paths are in
[cinematic-flora-art.json](cinematic-flora-art.json). The sharper replacement
assets and exact edit prompts are in [crisp-art.json](crisp-art.json).
Furniture crop geometry is in [furniture-grounding.json](furniture-grounding.json).
Full authoring masters remain in the workspace; the phone package includes
the packed atlases and four optimized scene images.

ElevenLabs generated 75 English performances using `eleven_multilingual_v2`
and stock voices George, Eric, Lily, Alice, Bill and Sarah. Scripts/settings are
in [voice-script.json](voice-script.json); runtime provenance is in
`public/assets/audio/voice/voice-manifest.json`. Narration is mastered to a
consistent level, with no added music. All 75 MP3 files are packaged locally.

The generator reads the key only from process environment, hidden input or
stdin. Credentials are absent from source files, manifests and production
JavaScript. Existing matching clips are retained on repeated generation runs.

Checks and their scope are recorded in [verification.md](verification.md).
