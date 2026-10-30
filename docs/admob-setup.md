# Eldervale AdMob setup

The Eldervale Android app is registered in the AdMob account as **Eldervale : Action RPG**.

- App ID: `ca-app-pub-6279186647593327~5553958355`
- Banner: `ca-app-pub-6279186647593327/9564521409`
- Interstitial: `ca-app-pub-6279186647593327/7981556007`
- Rewarded: `ca-app-pub-6279186647593327/7835497609`

The closed-test AAB remains in Google test mode so reviewers and closed testers are not served live ads. Switch `android/monetization.properties` to the live IDs only after the Play product and billing public key are ready, then increment `versionCode` and ship a new release.
