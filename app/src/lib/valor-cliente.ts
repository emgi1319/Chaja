import type { Cultivo, InsumoLinea, Productor } from "../types";

// Inversión de una línea de insumo: superficie del cultivo por dosis por hectárea
// por precio unitario. Es la base del cálculo de potencial.
export function totalLinea(superficieHa: number, l: InsumoLinea): number {
  return superficieHa * l.unidadXHa * l.usdXUnidad;
}

export function diferenciaLinea(superficieHa: number, l: InsumoLinea): number {
  return totalLinea(superficieHa, l) - (l.facturacionAnterior || 0);
}

export function valorCultivo(c: Cultivo): number {
  return c.insumos.reduce((acc, l) => acc + totalLinea(c.superficieHa, l), 0);
}

export function diferenciaCultivo(c: Cultivo): number {
  return c.insumos.reduce((acc, l) => acc + diferenciaLinea(c.superficieHa, l), 0);
}

export function valorClienteTotal(p: Productor): number {
  return p.unidades.reduce(
    (acc, u) => acc + u.cultivos.reduce((a, c) => a + valorCultivo(c), 0),
    0,
  );
}

export function diferenciaTotal(p: Productor): number {
  return p.unidades.reduce(
    (acc, u) => acc + u.cultivos.reduce((a, c) => a + diferenciaCultivo(c), 0),
    0,
  );
}

const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(n: number): string {
  return usd.format(n || 0);
}
