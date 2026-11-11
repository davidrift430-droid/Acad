import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dymotraining.app',
  appName: 'Dymo Training',
  webDir: 'dist',
  backgroundColor: '#0D0E11',
  android: { allowMixedContent: false },
};

export default config;
