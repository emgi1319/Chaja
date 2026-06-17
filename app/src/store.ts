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
} from "./lib/api";
import { seedDemo } from "./lib/seed";

type AppState = {
  user: User | null;
  catalogo: Producto[];
  dataVersion: number;
  setUser: (u: User) => void;
  logout: () => void;
  initData: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const useApp = create<AppState>((set, get) => ({
  user: readUser(),
  catalogo: [],
  dataVersion: 0,

  setUser: (user) => {
    storeUser(user);
    set({ user });
    void get().refresh();
  },

  logout: () => {
    clearUser();
    set({ user: null });
  },

  // Con backend trae todo del servidor; en modo local siembra los datos demo.
  refresh: async () => {
    seedDemo();
    if (!LOCAL_MODE && readToken()) {
      await pullAll();
    }
    const catalogo = await loadCatalog();
    set({ catalogo, dataVersion: get().dataVersion + 1 });
  },

  initData: async () => {
    await get().refresh();
  },
}));
