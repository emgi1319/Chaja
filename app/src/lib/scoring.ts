import type { Productor } from "../types";
import { valorClienteTotal, facturadoCliente } from "./valor-cliente";

export interface Scoring {
  score: number;
  categoria: "Alto" | "Medio" | "Bajo";
  captura: number;
  constancia: number;
  volumen: number;
}

export function facturacionTotal(p: Productor): number {
  return (p.facturacionMensual ?? []).reduce((a, m) => a + (m.monto || 0), 0);
}

// Scoring del cliente (0-100): combina la captura (facturado sobre potencial), la
// constancia (meses con facturación en el último año) y el volumen relativo a la cartera.
export function scoringCliente(p: Productor, maxVolumen: number): Scoring {
  const potencial = valorClienteTotal(p);
  const captura = potencial > 0 ? Math.min(1, facturadoCliente(p) / potencial) : 0;
  const meses = (p.facturacionMensual ?? []).filter((m) => (m.monto || 0) > 0).length;
  const constancia = Math.min(1, meses / 12);
  const volumen = facturacionTotal(p);
  const volRel = maxVolumen > 0 ? Math.min(1, volumen / maxVolumen) : 0;
  const score = Math.round(captura * 50 + constancia * 25 + volRel * 25);
  const categoria = score >= 70 ? "Alto" : score >= 40 ? "Medio" : "Bajo";
  return { score, categoria, captura, constancia, volumen };
}
