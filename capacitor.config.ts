import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mediatechempire.app',
  appName: 'MediaTech Empire',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: 'splash',
      showSpinner: false
    },
    App: {
      url: 'https://mediatechempire.com'
    }
  }
};

export default config;
