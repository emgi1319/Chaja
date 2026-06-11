import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.foroagrohub.app",
  appName: "FOROAGROHUB",
  webDir: "dist",
  backgroundColor: "#ffffff",
  android: {
    backgroundColor: "#ffffff",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#16BE78",
      showSpinner: false,
    },
  },
};

export default config;
