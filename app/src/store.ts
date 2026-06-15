import { create } from "zustand";
import type { Producto, User } from "./types";
import { clearUser, loadCatalog, readUser, storeUser } from "./lib/api";
import { seedDemo } from "./lib/seed";

type AppState = {
  user: User | null;
  catalogo: Producto[];
  setUser: (u: User) => void;
  logout: () => void;
  initData: () => Promise<void>;
};

export const useApp = create<AppState>((set) => ({
  user: readUser(),
  catalogo: [],

  setUser: (user) => {
    storeUser(user);
    set({ user });
  },

  logout: () => {
    clearUser();
    set({ user: null });
  },

  initData: async () => {
    seedDemo();
    const catalogo = await loadCatalog();
    set({ catalogo });
  },
}));
