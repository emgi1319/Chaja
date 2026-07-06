import { fetchParametros, pushParametro } from "./api";
import type { Campania, FormulaInsumo } from "../types";

// Parámetros globales que fija el supervisor. La fórmula agronómica define el costo
// por hectárea de cada cultivo (suma de dosis x costo unitario de sus insumos); ese
// costo/ha alimenta el Valor Cliente. El objetivo y el nombre de campaña configuran el
// panel; el cronograma de campañas alimenta los semáforos. Se cachea localmente y se
// sincroniza con el servidor cuando hay backend.
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
const DEFAULT_CAMPANIAS: Campania[] = [
  { nombre: "Maíz 2025/26", inicio: "2025-09-01", cierre: "2026-05-31" },
  { nombre: "Cebada 2026", inicio: "2026-05-01", cierre: "2026-06-25" },
  { nombre: "Trigo 2026", inicio: "2026-04-15", cierre: "2026-07-31" },
  { nombre: "Gruesa 2026/27", inicio: "2026-06-01", cierre: "2027-01-15" },
];
const DEFAULT_FORMULA: FormulaInsumo[] = [
  { cultivo: "Maíz", tipo: "Semilla", insumo: "Maíz híbrido", dosis: 1, unidad: "bolsa", costoUnit: 165 },
  { cultivo: "Maíz", tipo: "Fertilizante", insumo: "Urea", dosis: 6, unidad: "bolsa", costoUnit: 28 },
  { cultivo: "Maíz", tipo: "Herbicida", insumo: "Glifosato", dosis: 10, unidad: "L", costoUnit: 8.5 },
  { cultivo: "Soja", tipo: "Semilla", insumo: "Soja + inoculante", dosis: 1, unidad: "bolsa", costoUnit: 90 },
  { cultivo: "Soja", tipo: "Herbicida", insumo: "Glifosato", dosis: 8, unidad: "L", costoUnit: 8.5 },
  { cultivo: "Soja", tipo: "Fungicida", insumo: "Azoxistrobina", dosis: 1, unidad: "L", costoUnit: 42 },
  { cultivo: "Trigo", tipo: "Semilla", insumo: "Trigo", dosis: 1, unidad: "bolsa", costoUnit: 60 },
  { cultivo: "Trigo", tipo: "Fertilizante", insumo: "Urea", dosis: 2, unidad: "bolsa", costoUnit: 28 },
  { cultivo: "Girasol", tipo: "Semilla", insumo: "Girasol", dosis: 1, unidad: "bolsa", costoUnit: 120 },
  { cultivo: "Girasol", tipo: "Herbicida", insumo: "Glifosato", dosis: 8, unidad: "L", costoUnit: 8.5 },
  { cultivo: "Girasol", tipo: "Insecticida", insumo: "Cipermetrina", dosis: 2, unidad: "L", costoUnit: 19 },
  { cultivo: "Cebada", tipo: "Semilla", insumo: "Cebada", dosis: 1, unidad: "bolsa", costoUnit: 70 },
  { cultivo: "Cebada", tipo: "Fertilizante", insumo: "Urea", dosis: 4, unidad: "bolsa", costoUnit: 28 },
  { cultivo: "Sorgo", tipo: "Semilla", insumo: "Sorgo", dosis: 1, unidad: "bolsa", costoUnit: 55 },
  { cultivo: "Sorgo", tipo: "Fertilizante", insumo: "Urea", dosis: 4, unidad: "bolsa", costoUnit: 28 },
];

const DEFAULT_TIPOS = [
  "Semilla",
  "Fertilizante",
  "Herbicida",
  "Fungicida",
  "Insecticida",
  "Inoculante",
  "Coadyuvante",
  "Curasemilla",
  "Otros",
];

const KEY = "chaja.parametros";
const LEGACY_COSTOS_KEY = "chaja.costos_ha";

export interface Config {
  costosHa: Record<string, number>;
  objetivoCampania: number;
  nombreCampania: string;
  campanias: Campania[];
  formula: FormulaInsumo[];
  tiposInsumo: string[];
}

export function costosHaDesdeFormula(formula: FormulaInsumo[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const f of formula) {
    if (!f.cultivo) continue;
    m[f.cultivo] = (m[f.cultivo] || 0) + (f.dosis || 0) * (f.costoUnit || 0);
  }
  for (const k in m) m[k] = Math.round(m[k] * 100) / 100;
  return m;
}

function migrateLegacy(): Config {
  let costos = { ...DEFAULT_COSTOS };
  try {
    const old = localStorage.getItem(LEGACY_COSTOS_KEY);
    if (old) costos = { ...costos, ...(JSON.parse(old) as Record<string, number>) };
  } catch {
    // sin datos previos
  }
  return {
    costosHa: costos,
    objetivoCampania: DEFAULT_OBJETIVO,
    nombreCampania: DEFAULT_CAMPANIA,
    campanias: DEFAULT_CAMPANIAS,
    formula: DEFAULT_FORMULA,
    tiposInsumo: DEFAULT_TIPOS,
  };
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
        campanias: c.campanias && c.campanias.length > 0 ? c.campanias : DEFAULT_CAMPANIAS,
        formula: c.formula && c.formula.length > 0 ? c.formula : DEFAULT_FORMULA,
        tiposInsumo: c.tiposInsumo && c.tiposInsumo.length > 0 ? c.tiposInsumo : DEFAULT_TIPOS,
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

export function getCampanias(): Campania[] {
  return readCache().campanias;
}

export function getFormula(): FormulaInsumo[] {
  return readCache().formula;
}

export function getTiposInsumo(): string[] {
  return readCache().tiposInsumo;
}

export function addTipoInsumo(nombre: string): string[] {
  const c = readCache();
  const limpio = nombre.trim();
  if (limpio && !c.tiposInsumo.some((t) => t.toLowerCase() === limpio.toLowerCase())) {
    c.tiposInsumo = [...c.tiposInsumo, limpio];
    writeCache(c);
    void pushParametro("tipos_insumo", c.tiposInsumo);
  }
  return c.tiposInsumo;
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

export function setCampanias(camps: Campania[]): void {
  const c = readCache();
  c.campanias = camps;
  writeCache(c);
  void pushParametro("campanias", camps);
}

// Guarda la fórmula agronómica y aplica el costo/ha resultante a cada cultivo.
export function setFormula(formula: FormulaInsumo[]): void {
  const c = readCache();
  c.formula = formula;
  c.costosHa = { ...c.costosHa, ...costosHaDesdeFormula(formula) };
  writeCache(c);
  void pushParametro("formula", formula);
  void pushParametro("costos_ha", c.costosHa);
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
  if (Array.isArray(remote["campanias"]) && (remote["campanias"] as Campania[]).length > 0) {
    c.campanias = remote["campanias"] as Campania[];
  }
  if (Array.isArray(remote["formula"]) && (remote["formula"] as FormulaInsumo[]).length > 0) {
    c.formula = remote["formula"] as FormulaInsumo[];
  }
  if (Array.isArray(remote["tipos_insumo"]) && (remote["tipos_insumo"] as string[]).length > 0) {
    c.tiposInsumo = remote["tipos_insumo"] as string[];
  }
  writeCache(c);
}
