import type { Entity, Producto, Productor, NotaCampo, Referido, User } from "../types";
import { LocalCollection, newId } from "./db";

// API_BASE vacío = modo local sin backend (la app funciona 100% offline contra
// localStorage). Cuando el servidor PHP esté disponible, completar estos valores
// y la sincronización se activa sola.
const API_BASE = "";
const API_KEY = "";

const CATALOG_KEY = "fah.catalogo";
const USER_KEY = "fah.user";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error("offline");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as T;
}

// Repositorio con sincronización diferida: guarda local primero (marcado como
// pendiente) y sube al servidor cuando hay red. Si no hay backend o no hay
// señal, el registro queda pendiente y se reintenta más tarde.
export class SyncedCollection<T extends Entity> {
  private local: LocalCollection<T>;

  constructor(
    localKey: string,
    private remotePath: string,
  ) {
    this.local = new LocalCollection<T>(localKey);
  }

  list(): T[] {
    return this.local.list();
  }

  get(id: string): T | null {
    return this.local.get(id);
  }

  async save(item: T): Promise<void> {
    this.local.upsert({ ...item, synced: false });
    if (!API_BASE) return;
    try {
      await request(this.remotePath, { method: "POST", body: JSON.stringify(item) });
      this.local.markSynced(item.id);
    } catch {
      // queda pendiente; lo sube syncPending() cuando vuelva la señal
    }
  }

  async remove(id: string): Promise<void> {
    this.local.remove(id);
    if (!API_BASE) return;
    try {
      await request(`${this.remotePath}/${id}`, { method: "DELETE" });
    } catch {
      // se reintentará al resincronizar
    }
  }

  pendingCount(): number {
    return this.local.pending().length;
  }

  async syncPending(): Promise<number> {
    if (!API_BASE || !navigator.onLine) return 0;
    let done = 0;
    for (const item of this.local.pending()) {
      try {
        await request(this.remotePath, { method: "POST", body: JSON.stringify(item) });
        this.local.markSynced(item.id);
        done++;
      } catch {
        break;
      }
    }
    return done;
  }
}

export const productores = new SyncedCollection<Productor>("fah.productores", "/productores");
export const notasCampo = new SyncedCollection<NotaCampo>("fah.notas_campo", "/notas-campo");
export const referidos = new SyncedCollection<Referido>("fah.referidos", "/referidos");

export async function syncPending(): Promise<number> {
  const counts = await Promise.all([
    productores.syncPending(),
    notasCampo.syncPending(),
    referidos.syncPending(),
  ]);
  return counts.reduce((a, b) => a + b, 0);
}

export function pendingTotal(): number {
  return productores.pendingCount() + notasCampo.pendingCount() + referidos.pendingCount();
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function loadCatalog(): Promise<Producto[]> {
  if (API_BASE) {
    try {
      const data = await request<{ productos: Producto[] }>("/catalog");
      localStorage.setItem(CATALOG_KEY, JSON.stringify(data.productos));
      return data.productos;
    } catch {
      // sin red: se sirve el catálogo cacheado
    }
  }
  return cacheGet<Producto[]>(CATALOG_KEY) ?? [];
}

export function saveCatalogLocal(productos: Producto[]): void {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(productos));
}

export function readUser(): User | null {
  return cacheGet<User>(USER_KEY);
}

export function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

// Login. Con backend valida contra el servidor. Sin backend (demo), acepta la
// clave temporal y deriva el rol del usuario para poder recorrer la app.
// TODO(backend): reemplazar el modo local por autenticación real contra la API.
export async function login(usuario: string, password: string): Promise<User> {
  if (API_BASE) {
    return request<User>("/login", {
      method: "POST",
      body: JSON.stringify({ usuario, password }),
    });
  }
  if (password !== "demo") throw new Error("credenciales");
  const lower = usuario.toLowerCase();
  const rol: User["rol"] = lower.includes("gerente")
    ? "gerente"
    : lower.includes("super")
      ? "supervisor"
      : "vendedor";
  return { id: newId(), nombre: usuario, usuario, rol };
}
