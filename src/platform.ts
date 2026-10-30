import { Capacitor, registerPlugin, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { SplashScreen } from '@capacitor/splash-screen';

export const nativeAndroid = Capacitor.getPlatform() === 'android';
export const APP_ID = 'com.eldervale.hollowsun';
let immersive=false;
export function setGameplayFullscreen(active:boolean){
  if(!nativeAndroid||active===immersive)return;
  immersive=active;
  void (active?SystemBars.hide():SystemBars.show()).catch(()=>{});
}
const KEYS = ['eldervale.save.v1', 'eldervale.backup.v1', 'eldervale.settings', 'eldervale.review'];
let writes = Promise.resolve();
const PlayReview = registerPlugin<{ request(): Promise<{ requested: boolean }> }>('PlayReview');

/** A synchronous cache fits the RPG store; native writes remain ordered and durable. */
export async function createGameStorage() {
  if (!nativeAndroid) return localStorage;
  for (const key of KEYS) {
    const { value } = await Preferences.get({ key });
    if (value !== null) localStorage.setItem(key, value);
    else {
      const existing = localStorage.getItem(key);
      if (existing !== null) await Preferences.set({ key, value: existing });
    }
  }
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
      writes = writes.catch(() => {}).then(() => Preferences.set({ key, value }));
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      writes = writes.catch(() => {}).then(() => Preferences.remove({ key }));
    },
  };
}

export function flushNativeStorage() { return writes; }
export function saveDeviceReview(text: string) {
  localStorage.setItem('eldervale.review', text);
  if (nativeAndroid) writes = writes.catch(() => {}).then(() => Preferences.set({ key: 'eldervale.review', value: text }));
}
export function tactile(enabled = true) {
  if (nativeAndroid && enabled) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
export async function nativeShare(text: string) {
  if (!nativeAndroid) return false;
  await Share.share({ title: 'Eldervale: The Hollow Sun', text, dialogTitle: 'Share Eldervale' });
  return true;
}
export async function nativeExportSave(text: string, name: string) {
  if (!nativeAndroid) return false;
  const file = await Filesystem.writeFile({ path: 'saves/' + name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
  await Share.share({ title: 'Eldervale save', files: [file.uri], dialogTitle: 'Save or share your journey' });
  return true;
}
export async function nativeReview() {
  if (!nativeAndroid) return false;
  try { return (await PlayReview.request()).requested; } catch { return false; }
}
export async function installAndroidLifecycle(back: () => boolean, background: () => void, foreground: () => void) {
  if (!nativeAndroid) return;
  document.documentElement.classList.add('native-android');
  // Listener registration and bar styling must not delay removal of the native splash.
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
  void App.addListener('backButton', () => { if (!back()) void App.minimizeApp(); });
  void App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) foreground();
    else { background(); await flushNativeStorage(); }
  });
  await SplashScreen.hide();
}
