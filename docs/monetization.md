# Eldervale monetization — v1.6.0

This build uses **official Google demonstration ad IDs**, as requested. Native
AdMob provides banner, interstitial and rewarded formats. Google Play Billing
handles a one-time non-consumable Remove Ads product. The browser preview does
not simulate paid ownership or ad rewards.

Public deployment configuration: `android/monetization.properties`.

| Setting | Current value |
|---|---|
| mode | test |
| admobAppId | ca-app-pub-3940256099942544~3347511713 |
| bannerId | ca-app-pub-3940256099942544/9214589741 |
| interstitialId | ca-app-pub-3940256099942544/1033173712 |
| rewardedId | ca-app-pub-3940256099942544/5224354917 |
| removeAdsProductId | remove_ads |
| playBillingPublicKey | empty; checkout remains disabled |

Dependencies: Google Mobile Ads 25.5.0, UMP 4.0.0 and Play Billing 9.1.0. These
shared demonstration IDs cannot generate publisher revenue. Support labels the
build **TEST ADS** and offers an explicit test interstitial preview. The preview
is absent when `mode=live`.

## Placement

- Anchored adaptive banners appear on title, pause and Support screens. The UI
  reserves their height. Gameplay, dialogue and text-entry forms have no banner.
- Automatic interstitials are considered only on returning to the main menu:
  five minutes played, three distinct locations visited, and three minutes since
  the previous interstitial. Native live pacing also checks startup/cooldown.
  Battles and location transitions do not trigger ads.
- Optional supplies give **2 healing potions and 30 gold**, with a two-minute
  cooldown. The real native earned-reward callback must succeed before dismissal.
  Early closing, loading failure and duplicate claim IDs grant nothing.
- After SDK initialization and before loading ads, native app volume is set to
  zero and app-muted to true. Game audio/input/rendering pause during full-screen
  ads. Requests set maximum content rating G and non-personalized ads.
- Verified Remove Ads ownership removes all three formats. Supply caches can
  then be claimed directly, with the same cooldown.

Ads need a connection. The RPG, local voices and saved journey work offline.
UMP consent gates live requests; Privacy choices appears when Google requires
it. Demo mode uses Google's application ID without a publisher privacy-message
configuration.

## Remove Ads

The intended one-time US price is **US$4.99**. Checkout remains disabled without
a configured store product and valid public licensing key. Once configured,
Google Play supplies the actual offer token and localized price. Product pricing
and regional conversion are set in Play Console.

The native plugin queries owned purchases on initialization and foregrounding,
supports Restore, verifies the signed receipt's package/product/purchase state,
and acknowledges completed purchases before granting ownership. The product is
never consumed. Pending payments do not grant ownership.

Private native preferences cache only a signature-verified receipt. Imported
journey JSON and browser booleans cannot remove ads. Offline ownership is checked
against the signed receipt. Successful Play queries without the product clear
the cache; failed offline queries preserve previously verified ownership.

No store product or licensing key is registered in this local build. **Paid
checkout/restore has not been exercised against a real Play product.** RSA tests
do not replace Play license testing. A purchase-validation server and real-time
developer-notification service are not included in this local integration.

For live release, supply publisher-owned AdMob IDs, privacy messages and the
app's public licensing key; set `mode=live`; activate `remove_ads` as a one-time
non-consumable product at US$4.99; rebuild and upload to a Play internal track.
Test completed, pending, cancelled, restored and refunded purchases with license
test accounts. The live build guard rejects demo IDs or a missing licensing key.
Complete Play ads, privacy and data-safety declarations for the Google SDKs:
journeys stay local, while ad services make network requests.

## References and verification

[Official Google test IDs](https://developers.google.com/admob/android/test-ads),
[adaptive banners](https://developers.google.com/admob/android/banner),
[rewarded callbacks](https://developers.google.com/admob/android/rewarded),
[UMP consent](https://developers.google.com/admob/android/privacy), and
[Play Billing](https://developer.android.com/google/play/billing/integrate).

Reports: `test-results/monetization-report.json`,
`test-results/android-ads-report.json`, and native JUnit results in
`android/app/build/test-results/testDebugUnitTest/`.
