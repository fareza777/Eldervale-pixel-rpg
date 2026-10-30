# ELDERVALE — The Hollow Sun

A complete compact single-player action RPG for **Android in portrait mode**.
English throughout, with touch controls and an original campaign.

Every dawn steals a memory. Three mornings ago it stole your sister’s name.
Recover three ancient seals, uncover the origin of the false sun, and choose
what the next dawn will cost.

## Android

Install **releases/Eldervale-Android-v1.6.0.apk** on an Android phone.
The game includes its assets and works offline from the first launch.
**releases/Eldervale-Play-v1.6.0.aab** is the signed Google Play upload bundle.
Both builds use app ID `com.eldervale.hollowsun`, version 1.6.0 / code 8.

Native AdMob uses official Google test IDs for menu banners, natural-break
interstitials and optional rewarded supplies. Remove Ads is a one-time US$4.99
product; real checkout needs Play Console product/key configuration. Details:
**docs/monetization.md**. The preview does not simulate paid ownership or rewards.

The native app keeps progress/settings in Android preferences, respects system
bar insets, hides system bars during gameplay, pauses and saves when backgrounded, and handles Android Back.
It includes native sharing, save backups, optional touch feedback, and Google
Play review integration with local feedback when the review service is unavailable.

Build and signing instructions: **docs/android.md**.

## Browser preview

Requires Node.js 22.12+ or a newer supported release.

```powershell
cd "E:\Dawnbound RPG GPT 61"
npm install
npm run dev
```

Open **http://localhost:5174**. The preview uses the same portrait phone layout.

To play the production build:

```powershell
npm run build
npm run preview
```

Open **http://127.0.0.1:4174** and wait for **OFFLINE READY**. The production
game then remains available without a network connection in the same browser.
Progress stays on the device. Use **Menu → Back up journey** to export a backup;
**Restore backup** restores it.

## Controls

| Action | Control |
|---|---|
| Walk / run | Touch the left side, then drag gently / firmly; floating or fixed joystick in Settings |
| Interact | Facing an NPC/object reveals a right-side icon |
| Enter / leave | Face a house door and tap Enter; follow the road to its end |
| Attack | Hold the large right-hand Attack button |
| Signature skill | Skill button |
| Dodge | Dodge button |
| Healing potion | Heal button |
| Inventory | Top-right menu button → Bag |
| Stats / talents | Tap the hero portrait, then Overview / Talents |
| Journal / world map | Top-right menu button → Journal / Map |
| Pause | Top-right menu button → Menu, or Android Back |
| Close a panel | Close button or Android Back |

Menus pause combat. Town hearths restore health and mana. Death returns you
to your last town with a small capped gold loss; levels and quest progress
remain. Discover towns on foot to unlock fast travel.

## Included

- 27 outdoor areas: 6 towns, 10 wild roads and 11 dungeon areas.
- 30 furnished interiors with archives, inns, homes, shops, forges and alchemists.
- Residents stroll around all six towns and stop to face an approaching player.
- Smooth, slower walking and running with acceleration and brief braking.
- A full-screen Android world, collapsed menu shortcuts and high-density pixel rendering.
- Smooth camera following, native animation impact timing, sword arcs, recoil and swept arrow hits.
- Authored gardens, quays, chamber inlays, raised dungeon walls and quiet water reflections.
- Four new transparent architectural landmarks reused across the world.
- A compact quest compass without a dotted ground trail.
- Crisp reusable furnishings and flora, organic road edges and detailed tree bases.
- Branching expeditions through Cinderwatch, Moonmere and Starfall Refuge.
- Three ward chambers and a dramatic arena threshold before each guardian.
- 10 main quests, 16 side quests, 4 bosses, 6 ordinary enemy types.
- Warden, Ranger and Arcanist disciplines with distinct weapons and skills.
- Permanent XP, levels, talents, equipment, 43 items, loot and gathering.
- Merchants, alchemy, smithing, travelers’ events and recovered memory pages.
- Three endings. Share the Light requires four claimed side quests.
- Four illustrated prologue scenes, six voiced chronicle chapters and evolving NPC dialogue.
- 75 offline ElevenLabs voice performances, including restrained class skill calls.
- Splash, character creation, onboarding, continue/new game, settings,
  inventory, journal, map, codex, about, native sharing and Play reviews.
- Portrait obsidian, midnight blue and aged-gold menus with pagination.
- Versioned saves, validated JSON import/export, autosave and local backup
  before a new journey or imported save.
- Generated Android launcher/splash art, local fonts, optional haptics,
  native lifecycle/storage and an offline browser preview.

Share uses Android’s share sheet. Google controls whether the Play review
dialog is shown; sideloads use the local feedback fallback. The AAB has been
built locally and has not been published to Google Play.

## Art and audio

The original project **E:/Roguelike Opus 55** is unchanged. Packed pixel atlases
and selected item icons are reused from its Unity-derived Super Retro Collection.
Gameplay sprites appear naturally, including their small faces, as requested.
Large character portraits use completely closed masks and dark hoods.

New reusable art lives in **public/assets/art/**:

| File | Use |
|---|---|
| key-art.png | Cinematic landscape, onboarding and ending |
| app-icon.png | Browser/app icon |
| hero.png | Fully masked protagonist portrait |
| veiled-portraits.png | Six masked NPC portraits, 3 columns × 2 rows |
| relics-transparent-v2.png | Twelve transparent battle and item illustrations, 4 columns × 3 rows; original relics.png preserved |
| interior-furniture-source.png | Sixteen transparent reusable furnishings; packed into furniture.png/json |
| interior-furniture-crisp.png | Current clean furniture source; packed at twice the world resolution |
| story-cinematics.png | Four cinematic scenes; individual runtime files are story-0.webp through story-3.webp |
| flora-source.png | Six transparent botanical details; packed into flora.png/json |
| flora-crisp.png | Current clean botanical source; packed at twice the world resolution |

Seven stereo nature loops and seventeen Foley effects live in
**public/assets/audio/**. The v1.6 ambience is quietly mastered from three
ElevenLabs nature effects: sheltered air, empty stone spaces and distant water.
Its level smoothly falls to 22% during nearby danger. No bird recordings,
instruments or music are used. Previous river/wind masters by Thimras are
preserved outside the shipped assets. Generation prompts, source information
and measurements are in **docs/ambient-generation-v2.json**,
**public/assets/audio/sound-manifest.json** and **docs/quiet-ambience.json**.
75 spoken performances by ElevenLabs stock voices are bundled in
**public/assets/audio/voice/** and work offline. Voices have their own volume
slider and lower ambience while speaking. Skill calls rotate with a ten-second
minimum interval. Subtitle text and voice scripts share **src/story.json**.

Settings has four compact pages: Audio, Controls, Combat and Comfort. Choose
floating/fixed joystick, three joystick sizes, 65–100% control visibility,
automatic running, aim assistance, Classic strikes/Whirl finisher, Subtle/Full
hit effects, difficulty, camera motion, shake and haptics. Preferences persist
between launches. Classic directional sword strikes are the default; the third
strike remains stronger without a compulsory spin. Signature skills retain
their class animation. Reset preferences preserves the campaign.

The new art's exact generation prompts and reuse paths are recorded in
**docs/cinematic-flora-art.json**; furniture crop/foot anchors are in
**docs/furniture-grounding.json**. Revision details: **docs/cinematic-update.md**.
The current sharper furniture/flora edit prompts are in **docs/crisp-art.json**.
Regenerate VO with `python tools/generate-voice.py`: the authoring script reads
`ELEVENLABS_API_KEY` from the process environment or prompts for hidden input.
No API credential is stored in the game. Matching existing clips are reused.

To repack furniture and audio, run `python tools/package-exploration-assets.py`
with the downloaded field WAVs in `.audio-sources/` and the original asset
collection present. The optional authoring script requires Pillow, NumPy,
SciPy and imageio-ffmpeg; playing/building requires none of them. Original instrumental audio and uncovered portraits
are retained outside the public build in **asset-archive/excluded/**.

## Development and checks

```powershell
npm test
npm run typecheck
npm run dev:qa
# In a second terminal:
npm run test:e2e
npm run test:mobile
node tools/presentation-check.mjs
node tools/campaign.mjs
node tools/tween-check.mjs
node tools/exploration-check.mjs
node tools/story-check.mjs
node tools/world-polish-check.mjs
npm run test:residents
python tools/check-voice.py
# With the production preview running on 4174:
node tools/offline.mjs
# With the dedicated emulator-5584 running:
npm run test:android
npm run test:android-ads
```

Browser checks use local Chrome through Playwright. Set CHROME_PATH to its
executable if needed. QA runs on port 5175; its deterministic placement hook
is absent from production. Campaign verification uses real scene interactions
and attacks; it does not inject quest completions, XP, enemy health or rewards.
Screenshots and reports are written to **test-results/**.
Results are documented in **docs/verification.md**. Atlas frame dimensions
and reusable-art metadata are in **docs/art-manifest.json**.

Content: src/content-en.ts. Progression: src/core/store.ts. Authored layouts:
src/world/layout.ts. Rendering/combat: src/world/WorldScene.ts. UI: src/ui.ts.
