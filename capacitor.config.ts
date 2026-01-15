import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aero.dating',
  appName: 'AERO',
  webDir: 'public',
  // For development: uncomment and use your local IP or emulator IP
  // server: {
  //   url: 'http://192.168.1.180:3000', // Real phone: your PC's local IP
  //   // url: 'http://10.0.2.2:3000', // Android Emulator
  //   cleartext: true
  // }
  // For production: uncomment and use your Vercel URL
  // server: {
  //   url: 'https://your-app.vercel.app',
  //   cleartext: false
  // }
};

export default config;
