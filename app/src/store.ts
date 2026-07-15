import { create } from "zustand";
import type { Producto, User } from "./types";
import {
  LOCAL_MODE,
  clearUser,
  loadCatalog,
  pullAll,
  readToken,
  readUser,
  storeUser,
  setSombra as setSombraApi,
  getSombra,
} from "./lib/api";
import { seedDemo } from "./lib/seed";
import { loadParametros } from "./lib/parametros";

type AppState = {
  user: User | null;
  catalogo: Producto[];
  dataVersion: number;
  sombra: string | null;
  setUser: (u: User) => void;
  setSombra: (owner: string | null) => void;
  logout: () => void;
  initData: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useApp = create<AppState>((set, get) => ({
  user: readUser(),
  catalogo: [],
  dataVersion: 0,
  sombra: getSombra(),

  // El líder de equipo mira el trabajo de un integrante: se refresca todo para
  // que las pantallas se recalculen con los datos de esa persona.
  setSombra: (owner) => {
    setSombraApi(owner);
    set({ sombra: owner, dataVersion: get().dataVersion + 1 });
  },

  setUser: (user) => {
    storeUser(user);
    set({ user });
    void get().refresh();
  },

  logout: () => {
    clearUser();
    setSombraApi(null);
    set({ user: null, sombra: null });
  },

  // Con backend trae todo del servidor; en modo local siembra los datos demo.
  refresh: async () => {
    seedDemo();
    if (!LOCAL_MODE && readToken()) {
      await pullAll();
      await loadParametros();
    }
    const catalogo = await loadCatalog();
    set({ catalogo, dataVersion: get().dataVersion + 1 });
  },

  initData: async () => {
    await get().refresh();
  },
}));
