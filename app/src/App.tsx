import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { useApp } from "./store";
import { syncPending } from "./lib/api";
import { Login } from "./screens/Login";
import { Dashboard } from "./screens/Dashboard";
import { Home } from "./screens/Home";
import { Productores } from "./screens/Productores";
import { ProductorNuevo } from "./screens/ProductorNuevo";
import { Catalogo } from "./screens/Catalogo";
import { NotaCampoNueva } from "./screens/NotaCampoNueva";

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
  if (user.rol === "gerente") return <Dashboard />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/productores" element={<Productores />} />
      <Route path="/productores/nuevo" element={<ProductorNuevo />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/nota" element={<NotaCampoNueva />} />
    </Routes>
  );
}
