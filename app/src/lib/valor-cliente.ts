import type { Cultivo, Productor } from "../types";
import { costoHa } from "./parametros";

// Valor potencial de un cultivo: hectáreas por el costo/ha del cultivo (parámetro
// global). Es lo que ese productor invertiría en esa superficie.
export function valorCultivo(c: Cultivo): number {
  return (c.superficieHa || 0) * costoHa(c.cultivo);
}

export function facturadoCultivo(c: Cultivo): number {
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
