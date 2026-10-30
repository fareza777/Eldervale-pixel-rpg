# Eldervale: The Hollow Sun

Build an original, complete compact single-player action RPG using sprites, scenery and selected inventory icons copied from E:/Roguelike Opus 55. The source remains unchanged. Phaser 3.90.0 and TypeScript provide world rendering; a responsive DOM interface provides readable RPG menus. There are no external services or monetization requirements.

## Original campaign
Every dawn consumes a human memory. Your sister Lyra volunteered to repair the artificial sun and disappeared. Elderbrook's archivist sends you to collect three seals. Each guardian reveals the sun was built to shelter refugees from a cosmic predator; destroying it is not a simple rescue. Recover the seals in the Rootbound Sanctuary, Drowned Archive, and Frostglass Vault; reach the Hollow Spire and decide whether to remember, sacrifice, or share the burden. Choices and side quests change the ending text.

## Playable scope
Three towns (Elderbrook, Tidecross, Frosthaven), three wilderness regions (Whispering Wilds, Mire of Echoes, Frostglass Pass), three dungeons and a final Spire, connected with physical exits and discovered-location fast travel. Three character disciplines, persistent levels and experience, stat and skill points, weapons, armor, charms, loot, gathering, merchant, smith, alchemy, quests, events, checkpoints, boss patterns and campaign ending. Ten main objectives and ten optional quests use real objective progress and claim-once rewards. Dungeon layouts are authored and seeded decorations never obstruct required paths.

## Presentation
Obsidian, midnight blue, antique gold and parchment; Cormorant Garamond display typography paired with Manrope. Generated cinematic title landscape, app icon, fully masked protagonist and NPC portraits, and a twelve-item atlas are reusable project-local PNGs. Large serif title, offset menu, cinematic haze and understated motion. Gameplay has a slim HUD, a quest tracker, minimap, bottom action bar, animated pixel sprites, depth-sorted trees, buildings, particles and warm lamps. Game-specific composition replaces the marketing-page AIDA/scroll conventions in gpt-taste.

## Entry and menus
Short studio splash with skip, new game creation with name and discipline, three onboarding pages explaining story and controls, continue from save, settings (audio, difficulty, reduced motion, screen shake), about with asset provenance, share with clipboard fallback, and local feedback/rating without inventing an app-store listing. Inventory, character/talents, quest journal, world map, codex, pause, save export/import and ending screens. Desktop keyboard/mouse and touch controls. All interface and story text is English. Menus use compact layouts and pagination. On phones, character overview and talents have separate tabs. Large portraits hide all facial features behind opaque masks and hoods; gameplay sprites appear naturally, including faces, following the user’s explicit exception.

## Audio
Six stereo nature loops and fourteen physical Foley textures, procedurally authored as reusable WAVs. Wind, leaves, water, icy gusts and ruin drips; no musical instruments, melodies or voices. Original instrumental audio is archived outside the public game. Ambience crossfades between regions and pauses in hidden tabs.

## Reliability
Versioned JSON save with validation, local storage error feedback, backup on import/new game, position restored, completed quests and looted chests persist. Combat pauses while menus/dialogue are open. No progress reset on death: return to last town with a capped gold penalty. Gathering quests count historical collected nodes even if materials were used before acceptance. Region rebuilds release old tweens and timers. Main objectives require visit, dialogue, kill and interact events in the proper order. Unsafe HTML is escaped. Missing/corrupt saves leave the title usable. Sharing/rating must tell the truth about local/browser-only behavior.

## Validation
Unit tests cover progression, claim-once quest rewards, campaign gates, economy, save round-trip and malformed saves. Browser walkthrough covers title, creation, onboarding, town interaction, combat, inventory, journal, map, settings and reload persistence. Build must pass TypeScript and Vite. Document controls, run commands, content counts, asset provenance and platform limitations. This is a compact polished RPG; do not claim an AAA studio production or an APK/store release.
