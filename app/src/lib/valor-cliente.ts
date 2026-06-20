import type { Cultivo, InsumoLinea, Productor } from "../types";
import { costoHa } from "./parametros";

// Inversión potencial de un insumo sobre una superficie: dosis/ha x precio x hectáreas.
export function inversionInsumo(i: InsumoLinea, superficieHa: number): number {
  return (i.unidadXHa || 0) * (i.usdXUnidad || 0) * (superficieHa || 0);
}

// Valor potencial de un cultivo. Con canasta de insumos: suma de la inversión
// potencial de cada insumo. Sin canasta: hectáreas por el costo/ha (parámetro global).
export function valorCultivo(c: Cultivo): number {
  if (c.insumos && c.insumos.length > 0) {
    return c.insumos.reduce((acc, i) => acc + inversionInsumo(i, c.superficieHa), 0);
  }
  return (c.superficieHa || 0) * costoHa(c.cultivo);
}

export function facturadoCultivo(c: Cultivo): number {
  if (c.insumos && c.insumos.length > 0) {
    return c.insumos.reduce((acc, i) => acc + (i.facturacionAnterior || 0), 0);
  }
  return c.facturado || 0;
}

export function oportunidadCultivo(c: Cultivo): number {
  return valorCultivo(c) - facturadoCultivo(c);
}

function cultivosDe(p: Productor): Cultivo[] {
  return p.unidades.flatMap((u) => u.cultivos);
}

export function valorClienteTotal(p: Productor): number {
  return cultivosDe(p).reduce((acc, c) => acc + valorCultivo(c), 0);
}

export function facturadoCliente(p: Productor): number {
  return cultivosDe(p).reduce((acc, c) => acc + facturadoCultivo(c), 0);
}

export function diferenciaTotal(p: Productor): number {
  return valorClienteTotal(p) - facturadoCliente(p);
}

const usd = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsd(n: number): string {
  return usd.format(n || 0);
}
