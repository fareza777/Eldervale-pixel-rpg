# Verification — Eldervale v1.6.0

Verified 5 October 2026. Signed Android packages use version 1.6.0, code 8.
The current production preview is http://127.0.0.1:4174/; the reference
Dawnbound server also occupies localhost's IPv6 address, so verification uses
the explicit IPv4 address. Changes are documented in
[v1.6.0-update.md](v1.6.0-update.md).

| v1.6.0 check | Result |
|---|---|
| TypeScript, production build and signed native APK/AAB | Pass |
| Progression, content, motion, joystick, settings, collision and audio unit tests | 59 pass |
| Floating/fixed controls, four Settings pages, combo choices, patrols, solid houses, hit effects and combat ambience | 36 pass |
| Trusted touch walk/run/turn/cancel and real enemy attacks without red circles | 16 pass |
| Full viewport, three-class strikes, recoil, dodge and slow-frame response | 30 pass |
| Responsive menus, simultaneous trusted thumbs and control cancellation | 109 pass |
| Support, adaptive banner reservations and quiet nature-only ambience | 23 pass |
| Exploration, interior transitions, quest guidance, text separation and three classes | 111 pass |
| All 26 quests, four bosses, three endings and persistent campaign | 75 pass |
| Release signatures, versions, manifest, assets and credential exclusion | 14 pass |
| Native offline launch, controls, Settings, restart persistence, voice, Back, storage and lifecycle | 49 pass |
| Real Google demo banner, interstitial, rewarded and reward deduplication | 19 pass |
| Final production cache, offline world/save/voice and renderer reflow | 8 pass |

Floating controls were tested at different touch positions, through long drags,
reversals, two-thumb combat and cancellation. Fixed mode retains its anchor and
remains visible after release. All four Settings pages fit 360×740 and 390×844
phones without long scrolling. Android restart restores the selected fixed
joystick, large size, Whirl finisher and Subtle hit effects.

Actual hero movement is blocked by the abandoned houses in oldroad, causeway
and ridge. Layout tests also block every outdoor house foundation while
retaining reachable doors, exits and quest objects. Unengaged enemies patrol;
the denser encounters still allow completion of the entire campaign.

Both sword combo preferences play their native animation and deal damage once.
Classic strikes are the default and have no third-strike spin. Hit feedback is
observed on its actual scene frame, so screenshot/IPC delays cannot mistake a
short completed effect for a missing effect. Recoil recovers, and dodge or a
slow frame cannot produce a duplicate hit.

The transparent atlas has 60.34% fully transparent pixels and transparent
corners; the battle buttons use this new file. Nearly still natural air, stone
spaces and distant water were generated with ElevenLabs and quietly mastered
without added noise. The shipped loops have RMS ≤ .008, peaks < .056 and
closed waveform seams. Real nearby enemy actors smoothly lower environmental
gain below .24; the quiet exploration level returns after danger passes.
Foley and speech remain independent.

The dedicated headless Android emulator used an isolated ADB server and was
stopped after native verification. No JavaScript errors or native input ANRs
were recorded. Software-rendered emulator results verify function and layout;
physical Android phone frame rate has not been measured. Previous release
packages and verification history remain below.

## v1.5.1 verification history

Verified 5 October 2026. Signed Android packages use version 1.5.1, code 7;
the production preview is on port 4174. Changes are documented in
[v1.5.1-update.md](v1.5.1-update.md).

| v1.5.1 check | Result |
|---|---|
| TypeScript, production build and signed native APK/AAB | Pass |
| Progression, content, motion, display and exit unit tests | 46 pass |
| Trusted short joystick throw, gentle walk, full run, turns and cancellation | Pass |
| Motion plus real melee/ranged/charge/boss attacks without red ground circles | 16 pass |
| Full viewport, menus, camera, three-class strikes, dodge and slow frames | 30 pass |
| Responsive menus, simultaneous touch controls and cancellation | 101 pass |
| Support, adaptive banner reservations, movement and nature-only ambience | 23 pass |
| Release signatures, versions, manifest, assets and credential exclusion | 14 pass |
| Native offline launch, cutout, controls, voice, Back, storage and lifecycle | 42 pass |
| Real Google demo banner, interstitial, rewarded and reward deduplication | 19 pass |
| Final production cache, offline world/save/voice and renderer reflow | 8 pass |

The direct Dawnbound comparison found fixed acceleration, a longer joystick
throw and a sharp run-speed threshold behind the slower response. The revised
motion reaches about 70% full run in 50ms, preserves gentle walking and turns
within 50ms. Tests compare equal real time at 30/60fps. A real 22px thumb drag
produces 81.91 world pixels/s with native run animation at 0.999 time scale.
Footfall phase persists across direction and gait changes.

Enemy AI was observed throughout its windup and damage, including a melee
slime, ranged imp, charging Rootwarden and ranged Archivist. All four damage
the player with zero red-circle frames; their normal 650/850ms windups remain.

The 360, 390 and 412px banner-layout checks include 50/90px reservations and
24px simulated Android safe insets. Buttons and panels fit above the reserved
banner area. These are layout checks; real Google demo formats are checked
separately on the dedicated Android emulator.
The real native banner is visibly above Android navigation. Interstitial returns
to Support; gameplay hides the banner. A completed native rewarded ad grants
exactly two potions and 30 gold once, stores its claim and starts the cooldown.
Real paid Remove Ads remains disabled until Play product/key configuration.

An external request reset the shared Android Debug Bridge during native QA.
The application process remained alive with no application ANR. The lifecycle
suite resumed and completed all 42 checks. Native QA tools now accept a separate
ADB server/CDP port and only permit the dedicated emulator's two addresses.
This separates testing from resets of the shared debug connection.

The emulator uses software graphics for functional checks. Physical phone
frame rate has not been measured. The previous releases and campaign/content
verification below are preserved as history.

## v1.5.0 verification history

Verified 5 October 2026. The final signed APK/AAB use version 1.5.0, code 6.
The production preview runs on port 4174. All checks below completed without
JavaScript errors; native checks used the dedicated emulator-5584.

| v1.5 check | Result |
|---|---|
| TypeScript, production build and signed native APK/AAB | Pass |
| Progression, content, motion, display and exit approach unit tests | 40 pass |
| Browser walkthrough | 11 pass |
| Responsive phone menus and simultaneous touch controls | 101 pass |
| Full campaign, all 26 quests and three endings | 75 pass |
| Exploration, three classes, interiors and readable menus | 111 pass |
| Full viewport, collapsed shortcuts, camera, strikes, recoil and slow frames | 30 pass |
| Readability, ground pivots and panel fit | 50 pass |
| Cinematic voice, dialogue, interiors, choices and skill response | 69 pass |
| Resident movement, collision, stopping and Talk in all six towns | 27 pass |
| Support, natural motion and nature-only ambience | 17 pass |
| Hidden renderer, reflow and Continue | 6 pass |
| Final release signatures, manifest, offline assets and credential exclusion | 14 pass |
| Native offline launch, full screen, two thumbs, Back, storage and lifecycle | 42 pass |
| Real Google demo banner, interstitial and rewarded flows | 19 pass |
| Final production caching, offline voice/play and WebGL reflow | 8 pass |

The native gameplay viewport fills the complete 412 × 915 CSS screen, with an
824 × 1830 backing canvas. The world begins at y=0 behind the display cutout;
the menu remains below its 52px safe inset. Gameplay starts with shortcuts
collapsed and no native banner. Menus restore system bars; native banner
screenshots confirm that the banner stays above Android's navigation area.

An exit approach regression caught decorative archive shelving across a dungeon
threshold. Outdoor furniture now follows the same interaction clearance rules
as other props; every automatic exit has a clear approach lane. The full campaign
passes after this correction.

The software renderer also exposed Phaser's averaged frame delta stretching
movement and attack clips. The final build uses elapsed frame time with a capped
movement step. The native two-thumb check moves from x=432 to x=462.93 while
Attack is held; trusted pointer cancellation stops movement. Animation events
resolve hits once even after a 230ms stalled frame, and dodge cancels pending hits.

All 42 native lifecycle checks completed with no page errors or app ANR for the
run. All three official Google demo formats load. A completed rewarded ad grants
two potions and 30 gold exactly once, then updates its visible cooldown. Real
Remove Ads checkout still requires the user's Play product configuration;
this test build correctly keeps it disabled. The emulator uses software graphics
for functional checks; physical phone frame rate has not been measured.

Current reports and screenshots are in `test-results/`. Final release hashes are
in `releases/android-release-manifest.json`. Asset prompts/provenance are in
[world-art-v1.md](world-art-v1.md), and behavior changes in
[v1.5-update.md](v1.5-update.md). The previous v1.4 release files remain intact.

## v1.4 verification history

The v1.4 update reruns progression, motion, monetization policy, browser controls,
phone layouts, exploration, the full campaign and Android packaging. New motion
tests cover acceleration, diagonal speed, braking and 30/60 fps consistency.
Support checks verify that the browser does not fabricate a purchase or reward.

| v1.4 check | Result |
|---|---|
| TypeScript and production/native builds | Pass |
| Progression, content, motion and ad-policy unit tests | 35 pass |
| Native receipt signature and public-key validation | 5 pass |
| Browser walkthrough including real Talk | 11 pass |
| Responsive touch controls and phone menus | 101 pass |
| Complete campaign, 26 quests and three endings | 75 pass |
| Exploration, interiors, animations, actions and loot | 111 pass |
| Support layout/countdown, motion, clean quest compass and quiet ambience | 17 pass |
| Signed release, Google SDK manifest and packaged assets | 13 pass |
| Native offline lifecycle, controls, local voice and storage | 39 pass |
| Real Google demo banner, interstitial and rewarded flows/countdown | 19 pass |
| Final production cache, offline play/voice and WebGL reflow | 8 pass |

The following detailed baseline covers unchanged story/content/art behavior and
was verified for v1.3; it is retained as history. Current native/ad results are
recorded separately in `test-results/android-report.json` and
`test-results/android-ads-report.json`. Paid checkout requires a configured Play
product and license-test account and is not represented by signature unit tests.

An initial v1.4 native startup failed because MobileAds app-muted was set before
SDK initialization. The setting now runs in the initialization callback before
any ad loads. The rebuilt package passes all 39 offline native checks, including
keyboard/Back and cold restart, with no JavaScript errors or ANR for that run.

The final native ad run loads all three official Google demo formats. Actual
AdMob banner screenshots show reserved menu space. Interstitial opens Google's
AdActivity and returns to Support when dismissed; gameplay hides the banner.
A completed rewarded ad grants exactly two potions and 30 gold once, stores
its claim ID and starts the cooldown. The countdown advances in the open panel.
No native page errors were recorded, and the emulator's final last-ANR record
reports none since boot. Default US$4.99 pricing and the unconfigured native
checkout rejection are verified; a real paid purchase is still untested.

## v1.3 detailed baseline

Verified locally on Windows with Node 26.3.1 and Chrome, 4 October 2026.

| Check | Result |
|---|---|
| TypeScript + Vite production build | Pass |
| Progression/content, interiors and voiced-story unit tests | 29 pass |
| Portrait browser walkthrough | 11 pass |
| Readability, feet anchoring and responsive panels | 50 checks pass |
| Portrait layout, simultaneous touch controls and editing Back | 101 checks pass |
| Paused rendering, hidden canvas reflow and Continue | 6 checks pass |
| Signed Android APK and Play AAB builds | Pass |
| Release signatures, portrait manifest and packaged assets | 12 checks pass |
| Packaged Android WebView, controls, Back, storage, local voice and lifecycle | 39 checks pass |
| Full campaign, all 26 quests, three endings | 75 checks pass |
| Context actions, automatic exits, running, interiors, compass, item rates, animation and text overlap | 111 checks pass |
| Native attack / skill / dodge for all three classes | Included in 111 exploration checks |
| Cinematic, dialogue, choices, voice settings and combat response | 69 checks pass |
| Residents walking, collision, Talk and moving quest goals in all six towns | 27 checks pass |
| All packaged voice clips decoded and measured | 75 pass |
| Production service worker, offline voice/play and WebGL reflow | 8 checks pass |


The campaign walkthrough visits all towns and campaign/optional dungeon branches, speaks to the actual NPCs,
accepts and claims all sixteen side quests, gathers world objects, resolves an
event, crafts/equips gear and defeats all four bosses through real attacks.
All ten main objectives complete. Share the Light unlocks; importing a save
from before the final decision also verifies the other two endings.
Completed progress survives a reload.

QA placement sets player positions to keep the walkthrough deterministic.
It does not inject quest objectives, XP, rewards or enemy damage. Real movement and independent touch controls are also exercised. The exploration
layout checks use prepared chapter states to inspect later regions and test the
three classes; the campaign itself awards progress only through actual gameplay.

All 57 region nodes are connected, every door/required object is reachable, and
entry/return positions survive saving. Each guardian needs its approach wards;
its actor is absent until the player reaches the arena threshold. Enemy drop
rolls and the displayed probability tables share the same data. Chest tables
sum to 100% and return one equipment item alongside guaranteed supplies.

Text overlap tests inspect visible text rectangles at 360×740, 390×844 and
412×839. Inventory and journal lists have separate detail pages; the atlas is
paginated and short phones show fewer Codex cards. These layouts also pass
horizontal overflow and limited-scroll checks.

Production checks run the normal renderer with the network disabled after
service-worker installation. The title, local fonts, generated art, actual
world, inventory and save all work offline. The QA hook is absent from
production. Its MP3 requests are the local spoken performances. Only nature,
Foley and spoken voice assets are requested; there is no instrumental music.

Mobile checks at 390 × 844 inspect inventory, character overview/talents,
journal, map, codex and settings, with less than 100 pixels of panel overflow
and no horizontal page overflow. Desktop checks run at 1440 × 900; production
is also inspected at 1366 × 768.

Previously collected ore still counts toward a later gathering quest after
crafting/selling. Region transitions clear old tweens and pending attacks.
Mobile masked portraits, resumed region ambience and review drafts are covered
by the walkthroughs.

Reports/screenshots: test-results/browser-report.json, campaign-report.json,
disciplines-report.json, mobile-report.json, rendering-report.json,
android-report.json, android-release-report.json, offline-report.json and
story-report.json, residents-report.json, voice-report.json and accompanying
PNGs. Android release hashes are in releases/android-release-manifest.json.

Native checks use the owned Android 16/API 36 emulator-5584 at 720×1600,
with a 412×839 CSS WebView inside Android's system bars. Two independent
trusted touches move and attack simultaneously; menus use their DOM event
handlers. Actual Android Back, a completed native background transition,
the file-sharing chooser and process restart are tested through ADB. Save,
disabled haptics and five-star device feedback survive an offline cold start.
The final v1.3 run passes all 39 checks with no JavaScript errors or ANR for
its application process IDs. Prologue narration and the signature skill use
actual locally playing audio elements with device networking disabled.
An earlier v1.3 run reached 33 checks, then recorded a native input timeout
while dismissing the review keyboard; its trace includes
HardwareRenderer.syncAndDrawFrame. The hidden canvas now retains full phone
geometry. Production WebGL reflow and the complete native keyboard/Back,
chooser, save and cold-restart flow pass after that change. Android also
limits gameplay rendering to 30 fps and omits modal backdrop blur.
This is emulator verification; physical-phone performance is unmeasured.

The presentation update increases body text to 14–16 pixels and small labels
to at least 12 pixels. HUD dimensions and mobile panels accommodate the larger
type. The mobile talent tab omits the repeated talent heading and point counter.
Presentation checks cover 1440 × 900, 1366 × 768, 390 × 844 and 360 × 740.

Character pivots use the visible atlas frame boundary rather than the padded
source rectangle. Before the fix, visible hero feet ended 3.99 world pixels
(about 11 screen pixels) above the shadow center. All 48 walking frames across
the three classes now align with the ground, as do the town NPCs. Contact
shadows were added to NPCs/travelers and boss vertical hovering was removed.
The service-worker cache revision refreshes installed copies while preserving
local saves.

The game render loop sleeps behind panels and the main menu, then wakes when
gameplay resumes. The hidden world now keeps its full layout using visibility
instead of display removal, rather than shrinking to a minimum canvas.
Production WebGL checks cover review entry, a keyboard-sized viewport change
and Continue. Hidden canvas pixel and DOM dimensions are also checked at
390×500. Android Back ends text editing while preserving the form and value.

Standing furniture silhouettes do not overlap in any of the 30 interiors.
Furniture and flora use trimmed binary alpha, twice the world resolution and
half-scale rendering. The camera uses an integer 2× scale. Physical door
offsets match the building sprites, and road ends activate on foot. Exterior
captures include the curved road/grass contour and rooted tree bases.

Resident checks observe more than ten seconds of actual scene updates per
town. Every resident moves with native walk frames; sampled feet remain on
walkable terrain within their home radius. Object positions, shadows and quest
symbols stay synchronized. Approaching Mara stops her routine, reveals Talk
and completes the real initial quest through dialogue. Conversations pause
the routine; departing resumes it. Indoor shopkeepers remain at the counter.

Story panels pass text overlap and limited-scroll checks at three phone sizes.
The prologue and skills use actual locally decoded audio elements. All 75
MP3 performances decode to finite samples, total 483.58 seconds, and have a
maximum measured peak of −2.34 dBFS. Each skill call is shorter than four
seconds. Independent voice volume and old-settings migration are verified.

This is a complete compact Android portrait RPG with a browser preview.
Signed APK/AAB files are in releases/. Google Play publishing remains in
Play Console; review display depends on Google eligibility. The current
production JavaScript includes Phaser and produces Vite’s ordinary large-chunk
notice; the build succeeds.
