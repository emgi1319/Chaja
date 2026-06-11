import type { Entity } from "../types";

// Persistencia local: el dispositivo es la fuente de verdad de lo que carga el
// vendedor. Cada colección es una clave en localStorage. La sincronización con
// el servidor vive en api.ts y nunca bloquea la lectura.
export class LocalCollection<T extends Entity> {
  constructor(private key: string) {}

  private readAll(): T[] {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as T[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(items: T[]): void {
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  list(): T[] {
    return this.readAll().sort((a, b) => b.updatedAt - a.updatedAt);
  }

  get(id: string): T | null {
    return this.readAll().find((x) => x.id === id) ?? null;
  }

  upsert(item: T): void {
    const items = this.readAll();
    const idx = items.findIndex((x) => x.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.push(item);
    this.writeAll(items);
  }

  remove(id: string): void {
    this.writeAll(this.readAll().filter((x) => x.id !== id));
  }

  pending(): T[] {
    return this.readAll().filter((x) => !x.synced);
  }

  markSynced(id: string): void {
    const item = this.get(id);
    if (item) this.upsert({ ...item, synced: true });
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
