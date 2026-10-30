# Eldervale — The Hollow Sun

English Google Play campaign based on game v1.6.0.

## Ready-to-use assets

| File | Size / use |
|---|---|
| `app-icon-512.png` | 512 × 512, square PNG with an alpha channel; opaque artwork, no baked-in rounded corners |
| `feature-graphic-1024x500.png` | 1024 × 500, RGB PNG, no transparency |
| `screenshot-01` through `screenshot-08` | 1080 × 1920 portrait RGB PNGs, ordered for the store carousel |
| `eldervale-landscape-1080p.mp4` | 1920 × 1080, 30 fps, 40 seconds; H.264 video / AAC audio |
| `eldervale-portrait-1080p.mp4` | 1080 × 1920, 30 fps, 40 seconds; independently composed mobile layout |
| `trailer-en.vtt` | Optional English subtitle track |
| `asset-manifest.json` | Filenames, order, specifications and English alt text |
| `index.html` | Local preview gallery, with video playback |

The icon depicts a fractured Hollow Sun and a memory crystal, without people or faces. Illustrated characters in the other assets are masked, hooded or back-facing. Small gameplay sprites follow the requested exception. The trailer uses English ElevenLabs narration, nature ambience and Foley; no instrumental music.

## Upload notes

Upload the icon, feature graphic and screenshots to their corresponding Play Console fields. For the Play preview video, upload the landscape MP4 to YouTube and supply its URL in Play Console. The portrait MP4 is also provided for portrait promotional placements. Nothing has been uploaded or published by this task.

Current size and format references: [Google Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en) and [icon design specifications](https://developer.android.com/distribute/google-play/resources/icon-design-specifications), checked 6 October 2026.

## Content provenance

The world, combat, inventory, talents, dialogue and quest views are real captures of the existing game. Filming uses an isolated save and existing content. High-resolution moving captures advance the actual game simulation by 1/30 second per recorded frame; this avoids dropped recording frames without replacing the game's motion or effects. Menu shots are authentic static captures.

The symbol, key visual and empty-chair illustration were generated with the built-in image generation tool. Exact prompts are retained in `source/image-prompts.json`. Voice scripts and the capture manifest are retained alongside the editable project. Original game audio and fonts were reused. No credentials are included.

The app installation and native launcher icons were not replaced. This is a marketing asset package; the existing signed APK/AAB files remain as they were.
