# Eldervale Implementation Plan

> For agentic workers: implement in the current session with superpowers:executing-plans, then perform one independent review of the finished game.

**Goal:** Deliver a complete compact RPG with a new story, permanent progression, world exploration, generated art and a playable ending.

**Architecture:** Data-driven content feeds a tested campaign store. Phaser renders an authored connected world and reports objective events to the store. DOM screens subscribe to that store and pause combat while open.

**Tech Stack:** Phaser 3.90.0, TypeScript 5.9, Vite 7.3.6, GSAP 3.13.0, Vitest 4.1.11.

**Spec:** docs/superpowers/specs/2026-10-04-eldervale-design.md

## Global constraints
Source E:/Roguelike Opus 55 remains unchanged. All final generated art is copied into public/assets/art. Local single-player browser game; no fictitious published store URL. English throughout. Obsidian/midnight/gold theme. Large portraits fully masked; gameplay sprites natural with faces permitted. Nature ambience and SFX only; no instruments. Campaign ends through actual completed objectives.

## Review focus
Malformed saves recover without crashing. Claiming twice cannot duplicate rewards. Physical dungeon exits cannot be blocked by decorative props. Opening a menu or losing browser focus pauses combat. Saves contain current quest counters, collected objects, map and position.

### Task 1: Assets and runtime
Files: package.json, tsconfig.json, index.html, public/assets, src/world/animations.ts, src/world/tileIndex.ts.
- [x] Copy packed Unity-derived atlases, selected reusable inventory icons; archive instrumental originals outside the build.
- [x] Generate and save title illustration, app icon, hero portrait and item atlas.
- [x] Install pinned dependencies and verify asset names against atlas JSON.

### Task 2: Campaign and progression
Files: src/core/types.ts, src/content.ts, src/core/store.ts, tests/store.test.ts.
Interfaces: GameStore.newGame(name, discipline), emit(type, target), claimQuest(id), buy(id), equip(id), save(), load(), travel(id). Content exports regions, NPCs, quests, items, skills, bestiary and ending text.
- [x] Write tests for accumulated level gains, duplicate reward rejection, objective gates and malformed saves.
- [x] Run npm test and observe failures before implementing the store.
- [x] Add persistent save validation, economy, item use, talents, choice effects and quest event updates.
- [x] Run npm test and confirm the meaningful progression cases pass.

### Task 3: World and action combat
Files: src/world/layout.ts, src/world/WorldScene.ts, src/audio.ts.
Interfaces: WorldScene consumes the store, publishes nearby interactions and HUD position, handles movement/attack/skill/dodge/potions, and rebuilds regions on travel.
- [x] Author maps with clear travel corridors, town houses, landmarks, collectibles and boss arenas.
- [x] Implement animated movement, collisions, melee/ranged attacks, enemy telegraphs, projectiles, drops, boss phases and death recovery.
- [x] Add crossfading nature ambience, ambient particles, shadows, lighting and checkpoints.

### Task 4: Complete RPG interface
Files: src/main.ts, src/ui.ts, src/icons.ts, src/style.css, public/manifest.webmanifest.
- [x] Build studio splash, cinematic title, creation, onboarding and responsive game HUD.
- [x] Build dialogue/choices, quest journal, inventory/equipment, talents, world map, shop/crafting, codex and ending.
- [x] Add settings, truthful share/rate flows, local save export/import, keyboard shortcuts and touch controls.

### Task 5: End-to-end verification and handoff
Files: tools/verify.mjs, README.md, docs/verification.md.
- [x] Run npm run build and npm test.
- [x] Launch the game, inspect browser screenshots and walk through new game, town, combat and all main menus.
- [x] Complete campaign in a deterministic integration scenario, inspect ending and confirm reload persistence.
- [x] Have one fresh reviewer inspect the implementation; fix material issues and rerun affected checks.
- [x] Open the finished game in Codex and document commands, controls, content and real limitations.

## Final review resolutions
- Late gathering acceptance: credits historical nodes; failing regression test observed and fixed.
- Region tween retention: repeated loads grew 11 → 77 tweens before the fix, remain 11 after it.
- Mobile masked portrait visibility, resumed region ambience, and review draft preservation fixed.
- Mobile character panels split into Overview and Talents to avoid a long vertical panel.
- Instrumental audio and unused uncovered art excluded from production.
