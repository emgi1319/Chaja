// Costo por hectárea de cada cultivo. Es un parámetro global que fija el
// supervisor (sale de la calculadora de costos). El Valor Cliente se calcula
// como hectáreas por cultivo x costo/ha. Los defaults vienen de la calculadora
// del cliente; se editan en la pantalla de Parámetros.
const DEFAULT_COSTOS: Record<string, number> = {
  Maíz: 418,
  Soja: 196,
  Trigo: 122,
  Girasol: 0,
  Cebada: 0,
  Sorgo: 0,
};

const KEY = "chaja.costos_ha";

export function getCostosHa(): Record<string, number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_COSTOS, ...(JSON.parse(raw) as Record<string, number>) };
  } catch {
    // sin datos guardados: se usan los defaults
  }
  return { ...DEFAULT_COSTOS };
}

export function setCostosHa(costos: Record<string, number>): void {
  localStorage.setItem(KEY, JSON.stringify(costos));
}

export function costoHa(cultivo: string): number {
  return getCostosHa()[cultivo] ?? 0;
}
