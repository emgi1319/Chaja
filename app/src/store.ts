import { create } from "zustand";
import type { Producto, User } from "./types";
import { clearUser, loadCatalog, readUser, storeUser } from "./lib/api";

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
    const catalogo = await loadCatalog();
    set({ catalogo });
  },
}));
