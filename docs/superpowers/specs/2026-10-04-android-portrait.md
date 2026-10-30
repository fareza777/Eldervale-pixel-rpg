# Eldervale Android portrait edition

The primary product is an offline Android RPG intended for Google Play. The
browser is a development preview of the same phone layout. Preserve the whole
campaign, generated reusable assets, natural gameplay sprites, masked portraits,
English copy, premium obsidian/gold design and nature/Foley audio only.

Use a portrait phone frame with safe-area padding. Place the movement joystick
at the lower left and a large hold-to-attack control at the lower right. Keep
skill, dodge and potion within the right thumb's reach, without overlaps.
Provide labeled bottom navigation for Bag, Journal, Map and Menu. Portrait
onboarding teaches touch controls. Keep readable 14–16 px body text, 12 px
minimum labels, 44 px or larger touch targets, compact paginated menus, and
the corrected sprite foot pivots.

Native Android requirements: Capacitor 8, SDK 36, portrait activity, packaged
offline assets, app icon/splash, Android Back closes the current panel or pauses
the game, backgrounding saves and pauses audio/combat, Preferences-backed saves,
native sharing and save export. Preserve existing browser saves. No ads,
analytics, accounts or network-dependent game content.

App identifier: com.eldervale.hollowsun. This is a local implementation choice
because no existing Play listing/package identifier was supplied. Build a debug
APK for testing and a signed release AAB with a new locally stored upload key.
Do not upload/publish or access the user's Play Console. A public store review
uses the Android in-app review API once distributed through Play; a local
feedback option remains available during development.

Validate actual multitouch movement plus attacks, pointer release/cancellation,
menu touch navigation, portrait orientation, lifecycle, native save persistence,
offline loading, safe-area placement and output APK/AAB signatures. Use a
dedicated emulator and browser phone sizes 360×740, 390×844 and 412×915.
