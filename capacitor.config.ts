import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eldervale.hollowsun',
  appName: 'Eldervale',
  webDir: 'dist',
  backgroundColor: '#11121c',
  android: { backgroundColor: '#11121c', allowMixedContent: false, captureInput: true },
  plugins: {
    SystemBars: { style: 'DARK', insetsHandling: 'disable' },
    SplashScreen: { launchAutoHide: true, launchShowDuration: 600, backgroundColor: '#11121c', showSpinner: false },
  },
};
export default config;
