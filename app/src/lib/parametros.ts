import { fetchParametros, pushParametro } from "./api";

// Parámetros globales que fija la gerencia. El costo por hectárea de cada cultivo
// alimenta el cálculo de Valor Cliente (hectáreas x costo/ha); el objetivo y el
// nombre de campaña configuran el panel. Se cachean localmente y se sincronizan
// con el servidor cuando hay backend, para que todos los dispositivos vean lo mismo.
const DEFAULT_COSTOS: Record<string, number> = {
  Maíz: 418,
  Soja: 196,
  Trigo: 122,
  Girasol: 0,
  Cebada: 0,
  Sorgo: 0,
};
const DEFAULT_OBJETIVO = 0;
const DEFAULT_CAMPANIA = "2025/26";

const KEY = "chaja.parametros";
const LEGACY_COSTOS_KEY = "chaja.costos_ha";

export interface Config {
  costosHa: Record<string, number>;
  objetivoCampania: number;
  nombreCampania: string;
}

function migrateLegacy(): Config {
  let costos = { ...DEFAULT_COSTOS };
  try {
    const old = localStorage.getItem(LEGACY_COSTOS_KEY);
    if (old) costos = { ...costos, ...(JSON.parse(old) as Record<string, number>) };
  } catch {
    // sin datos previos
  }
  return { costosHa: costos, objetivoCampania: DEFAULT_OBJETIVO, nombreCampania: DEFAULT_CAMPANIA };
}

function readCache(): Config {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const c = JSON.parse(raw) as Partial<Config>;
      return {
        costosHa: { ...DEFAULT_COSTOS, ...(c.costosHa ?? {}) },
        objetivoCampania: c.objetivoCampania ?? DEFAULT_OBJETIVO,
        nombreCampania: c.nombreCampania ?? DEFAULT_CAMPANIA,
      };
    }
  } catch {
    // sin datos guardados: defaults
  }
  return migrateLegacy();
}

function writeCache(c: Config): void {
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function getConfig(): Config {
  return readCache();
}

export function getCostosHa(): Record<string, number> {
  return readCache().costosHa;
}

export function costoHa(cultivo: string): number {
  return readCache().costosHa[cultivo] ?? 0;
}

export function getObjetivoCampania(): number {
  return readCache().objetivoCampania;
}

export function getNombreCampania(): string {
  return readCache().nombreCampania;
}

export function setCostosHa(costos: Record<string, number>): void {
  const c = readCache();
  c.costosHa = costos;
  writeCache(c);
  void pushParametro("costos_ha", costos);
}

export function setObjetivoCampania(n: number): void {
  const c = readCache();
  c.objetivoCampania = n;
  writeCache(c);
  void pushParametro("objetivo_campania", n);
}

export function setNombreCampania(s: string): void {
  const c = readCache();
  c.nombreCampania = s;
  writeCache(c);
  void pushParametro("nombre_campania", s);
}

// Trae los parámetros del servidor y refresca el cache local.
export async function loadParametros(): Promise<void> {
  const remote = await fetchParametros();
  if (!remote || Object.keys(remote).length === 0) return;
  const c = readCache();
  if (remote["costos_ha"]) {
    c.costosHa = { ...DEFAULT_COSTOS, ...(remote["costos_ha"] as Record<string, number>) };
  }
  if (typeof remote["objetivo_campania"] === "number") {
    c.objetivoCampania = remote["objetivo_campania"] as number;
  }
  if (typeof remote["nombre_campania"] === "string") {
    c.nombreCampania = remote["nombre_campania"] as string;
  }
  writeCache(c);
}
