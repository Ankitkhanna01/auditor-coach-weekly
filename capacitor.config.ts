import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.neverlate',
  appName: 'NeverLate',
  webDir: 'dist',
  server: {
    url: 'https://25f0eab5-a6a6-4da9-a1d1-61d494298526.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
