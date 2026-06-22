import { useEffect } from "react";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useApp } from "./store";
import { syncPending } from "./lib/api";
import { Login } from "./screens/Login";
import { Dashboard } from "./screens/Dashboard";

export default function App() {
  const user = useApp((s) => s.user);
  const initData = useApp((s) => s.initData);

  useEffect(() => {
    void initData();
    void syncPending();

    const onOnline = () => void syncPending();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void initData();
        void syncPending();
      }
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);

    let backHandle: PluginListenerHandle | undefined;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else CapApp.exitApp();
      }).then((h) => (backHandle = h));
    }

    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      backHandle?.remove();
    };
  }, [initData]);

  if (!user) return <Login />;
  // Interfaz única por perfil (vendedor / supervisor / gerente); el menú se filtra
  // por rol dentro del Dashboard.
  return <Dashboard />;
}
