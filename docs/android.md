# Eldervale Android — v1.7.0

The primary target is an Android phone held in portrait orientation. The
browser preview shares its phone layout. Android 7.0/API 24 is the minimum;
the app compiles and targets API 36. The game is bundled locally with Capacitor.

## Deliverables

| File in releases/ | Purpose |
|---|---|
| Eldervale-Android-v1.7.0.apk | Signed release APK for installing on a phone |
| Eldervale-Play-v1.7.0.aab | Signed Android App Bundle for Play Console |
| Eldervale-Android-debug.apk | Debug build for WebView/device QA |

App ID: `com.eldervale.hollowsun`. App name: **Eldervale**.
Version name: **1.7.0**. Version code: **9**.

## Touch layout

Use a gentle joystick drag to walk, a short firm drag to run, and hold the large right Attack button for
continuous attacks. Skill, Dodge and Heal sit beside Attack, with visible
cooldowns and potion count. The top-right menu button exposes Bag, Journal, Map
and Menu in a compact tray; shortcuts collapse when a panel opens or movement resumes.
Tap the portrait for stats and talents. Use the small compass to open its tracked quest. Face nearby NPCs to reveal
the right-side Talk icon. Town residents stroll slowly and stop when approached;
the quest compass follows their current position. Face a house's physical door for Enter; road ends
change areas on foot without portal circles. Every town has five furnished
houses. Quest notices and chest receipts disappear briefly after an update. Menus pause gameplay and release both thumbs.

System bars hide during gameplay and return for panels, title screens and ads.
The high-density canvas retains full geometry while hidden, and the HUD respects cutouts and system insets. MainActivity owns safe-area CSS and keyboard resize; the bundled SystemBars inset handler is disabled to let the world draw behind cutouts on older WebViews. The activity is locked
to portrait. Android Back closes a panel or pauses gameplay; Back from the
main menu minimizes the app. Leaving the app releases input, pauses audio,
saves the journey and pauses gameplay. Returning shows the current panel or
the pause menu.
The renderer sleeps behind menus and the title screen while retaining its
full canvas layout. Android Back ends
text editing before dismissing the form, preserving the player's draft.
Android rendering is capped at 30 fps and modal backgrounds use a dark tint
without backdrop blur to reduce compositor work during native transitions.

## Native services

Progress, settings, backup and local feedback are stored through Android
Preferences, with a synchronous local cache for the RPG engine. Existing
version-1 saves remain compatible. No network connection is needed on first
launch. Native packages do not use the browser service worker.

Share opens Android’s chooser. **Back up journey** writes a JSON backup in
the app cache and opens the chooser so the player can save it elsewhere.
**Restore backup** uses the Android file picker. Haptics can be disabled in
Settings. Large portraits remain fully masked; gameplay sprites are natural.
Audio is quiet wind/river ambience, Foley and 75 offline ElevenLabs voice performances;
there is no instrumental music. Settings has independent ambience, effects
and voice controls. Narrative speech takes priority over skill calls. The
prologue can be skipped, advanced manually or replayed from Menu / About.

Rate requests Google’s in-app review flow. Eligibility and dialog display
are controlled by Google. Installs without an eligible Play service use local
feedback. No public review is claimed or submitted automatically.

## Rebuild

Install Node 22.12+, Java 21, Android SDK platform 36 and build-tools 36.0.0.
Set `ANDROID_HOME` if the SDK is outside `%LOCALAPPDATA%/Android/Sdk`; Java’s
`java`, `javac` and `keytool` must be on PATH.

```powershell
cd "E:\Dawnbound RPG GPT 61"
npm install
npm run android:build
```

The command typechecks/builds the web game, syncs the native project, and
builds debug APK, signed release APK and signed AAB into releases/. Launcher
and splash resources can be regenerated from the existing reusable generated
icon with `powershell -NoProfile -File tools/android-art.ps1`.

The local upload key is **android/keystore/eldervale-upload.jks**. Its signing
configuration is **android/signing.properties**. Preserve both privately for
future builds. They are ignored by Git and excluded from distributable game
packages. The build script creates them only when no signing configuration
exists; it does not print passwords.

## Play Console

The release AAB is available for upload. This workspace has not published an
app or created a store listing. Use Play Console to configure the listing,
content rating, data-safety declaration and Play App Signing, and run an
internal test before releasing. This build contains native Google test AdMob
ads and Play Billing. Real checkout remains disabled until the product and
licensing key are configured. Player journey data stays locally on the device;
Google ad services make network requests and must be included in Play ads,
privacy and data-safety declarations. Player sharing is explicit through the
Android chooser. Configuration, placement and purchase handling are documented
in **docs/monetization.md**.

Current platform references: [Capacitor Android](https://capacitorjs.com/docs/android),
[Capacitor 8 migration](https://capacitorjs.com/docs/updating/8-0),
[Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk),
and [Google in-app review integration](https://developer.android.com/guide/playcore/in-app-review/kotlin-java).

## Device QA

`tools/android-check.mjs` operates only the disposable **emulator-5584**
(eldervale_qa, Android 16/API 36). It installs and clears the debug package
on that emulator, disables its networking, and tests the packaged game.
Reports and native screenshots are saved in test-results/. It does not
operate physical devices or other running emulators.

`npm run test:android-ads` uses the same disposable emulator after the offline
check, enables networking and exercises real Google demo formats. It verifies
reserved banner space, real native full-screen ad activities, rewarded supplies
and a disabled unconfigured checkout. It does not charge or simulate purchases.

`npm run test:release` verifies the signed APK/AAB, app ID/version,
portrait manifest, SDK levels, bundled audio and exclusion of private keys
and QA hooks. SHA-256 hashes are saved in releases/android-release-manifest.json.

Browser touch checks use actual independent pointer IDs for simultaneous
movement and Attack, with cancellation, native lifecycle handlers, panel
fit and reachable targets checked on 360×740, 390×844 and 412×915 layouts.

Run `npm run test:android` with that emulator running. It sends independent
trusted touch events through the native Chromium WebView’s input pipeline,
then cancels both fingers. Menu flows exercise their real DOM handlers;
Android Back, Home, sharing and process restart use ADB on the actual emulator.
The headless image's launcher can fail to stop the foreground activity after
Home; the lifecycle check then displays Android Settings to guarantee an
opaque native activity is foregrounded and Eldervale reaches STOPPED before
returning to the game.
`npm run test:rendering` also verifies suspended/resumed frames and a hidden
canvas through a keyboard-sized viewport change. Physical-device performance
has not been measured by this local emulator workflow.
