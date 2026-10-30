# Eldervale — The Hollow Sun / Remotion campaign

40-second English campaign in landscape and portrait, plus ten store asset compositions. Original cinematic art, actual game footage, ElevenLabs narration and Foley. No music.

Run `npm ci`, then `npx remotion studio --no-open --port=3003`.

Main compositions: `Eldervale-Landscape` (1920 × 1080) and `Eldervale-Portrait` (1080 × 1920), both 30 fps / 1200 frames. The scene folder exposes each scene as an editable timeline. `Play-Store` contains the icon, feature graphic and eight screenshots.

Export all PNGs and scene proofs with `node render-assets.mjs stills`. Export MP4 with `node render-assets.mjs Eldervale-Landscape` and `node render-assets.mjs Eldervale-Portrait`. The render script uses the local Chrome installation; edit its `browserExecutable` when moving to another machine. Outputs go to `../store-v1/exports`.

Asset provenance and exact generation prompts are in `../store-v1/source`. No API key is stored in this project. The original app is untouched.

---

# Remotion setup

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
