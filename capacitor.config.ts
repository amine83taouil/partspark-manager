import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5931e7d8d84048179d1144dcc9836e87',
  appName: 'partspark-manager',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://5931e7d8-d840-4817-9d11-44dcc9836e87.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;