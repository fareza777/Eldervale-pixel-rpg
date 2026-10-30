# Android Portrait Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this
> plan task by task in the existing workspace. Steps use checkbox tracking.

**Goal:** Deliver Eldervale as a touch-first portrait Android game with APK/AAB.

**Architecture:** Retain the Phaser RPG and its progression/content. A portrait
container and thumb controls replace the desktop presentation. Capacitor bundles
the game and supplies native lifecycle, sharing, storage and tactile feedback.

**Tech Stack:** Phaser 3, TypeScript, Capacitor 8, Java 21, Android SDK 36.

**Spec:** ../specs/2026-10-04-android-portrait.md

## Global Constraints

- Android portrait is the primary platform; browser previews use a phone frame.
- English; obsidian/gold; body text 14–16 px; labels at least 12 px.
- Natural gameplay sprites; masked large portraits; no instrumental audio.
- Preserve quests, progression and existing saves.
- No publishing or contacting anyone; local builds and local testing only.

## Review Focus

- Simultaneous joystick and attack must continue moving without stuck inputs.
- Back/background/cancel must release movement and prevent combat behind panels.
- Insets, short phones and soft keyboard must keep active controls reachable.
- App process recreation must retain both settings and campaign progress.
- Native packaged assets must work on first launch without a network connection.

### Task 1: Portrait touch gameplay

- [x] Write a failing touch browser check for portrait layout, hit areas and hold attack.
- [x] Add container-based phone sizing, thumb controls, compact HUD and labeled bottom navigation.
- [x] Replace keyboard-facing product copy with touch instructions.
- [x] Implement dead-zone joystick, pointer capture/cancel, hold attack and pause input reset.
- [x] Verify gameplay/panels on three phone sizes and a wide browser preview.

### Task 2: Native Android integration

- [x] Add pinned Capacitor dependencies/config and generate the Android project.
- [x] Implement durable native storage, share/save export, Back and background handling.
- [x] Set portrait, SDK 36, generated launcher/splash art and safe-area behavior.
- [x] Add in-app Play review plus local feedback fallback.
- [x] Build debug APK and signed release AAB; retain the upload key locally.

### Task 3: Device verification and delivery

- [x] Launch a dedicated emulator, install the debug APK and inspect the native WebView.
- [x] Test touch movement/combat, native Back, orientation, lifecycle and offline restart.
- [x] Verify signing/manifest/assets and update source/build instructions and reports.
- [x] Rebuild production preview and deliver APK/AAB links.
