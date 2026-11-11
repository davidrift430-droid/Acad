import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blackiron.app',
  appName: 'Black Iron',
  webDir: 'dist',
  backgroundColor: '#0D0E11',
  android: { allowMixedContent: false },
};

export default config;
