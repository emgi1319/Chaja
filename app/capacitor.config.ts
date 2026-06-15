import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chaja.app",
  appName: "Chaja",
  webDir: "dist",
  backgroundColor: "#ffffff",
  android: {
    backgroundColor: "#ffffff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#1B5E9B",
      showSpinner: false,
    },
  },
};

export default config;
