import './style.css';
import './mobile.css';
import { GameStore } from './core/store';
import { AudioManager } from './audio';
import { GameUI } from './ui';
import { createGameStorage, installAndroidLifecycle, nativeAndroid } from './platform';
import { Monetization } from './monetization';

const store = new GameStore(await createGameStorage());
const audio = new AudioManager(store);
const monetization = new Monetization(store);
const ui = new GameUI(store, audio,monetization);
void monetization.initialize().catch(()=>{});
void installAndroidLifecycle(() => ui.androidBack(), () => ui.appBackground(), () => audio.setAppActive(!monetization.state.fullScreen));
// Deterministic test access is stripped from production by Vite.
if (import.meta.env.MODE === 'qa') Object.defineProperty(window, '__eldervaleQA', { value: { store, ui,monetization } });
// Cache only the production game. Development keeps hot reload and tests fresh.
if (import.meta.env.PROD && !nativeAndroid && 'serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(() => { const el = document.querySelector('#offline-status'); if (el) el.textContent = 'OFFLINE READY'; }).catch(() => {}); });
