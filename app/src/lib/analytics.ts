import { notasCampo, productores } from "./api";
import { diferenciaTotal, formatUsd, valorClienteTotal, valorCultivo } from "./valor-cliente";
import {
  ESTADOS_PROCESO,
  ESTADO_PROCESO_LABEL,
  type EstadoProceso,
  type Productor,
} from "../types";

export interface CarteraKpis {
  productores: number;
  potencial: number;
  oportunidad: number;
  notas: number;
}

export function carteraKpis(): CarteraKpis {
  const ps = productores.list();
  return {
    productores: ps.length,
    potencial: ps.reduce((a, p) => a + valorClienteTotal(p), 0),
    oportunidad: ps.reduce((a, p) => a + diferenciaTotal(p), 0),
    notas: notasCampo.list().length,
  };
}

export interface RankingItem {
  productor: Productor;
  valor: number;
  oportunidad: number;
}

export function rankingProductores(): RankingItem[] {
  return productores
    .list()
    .map((p) => ({ productor: p, valor: valorClienteTotal(p), oportunidad: diferenciaTotal(p) }))
    .sort((a, b) => b.valor - a.valor);
}

export interface EmbudoItem {
  estado: EstadoProceso;
  label: string;
  count: number;
}

export function embudo(): EmbudoItem[] {
  const counts: Partial<Record<EstadoProceso, number>> = {};
  for (const n of notasCampo.list()) {
    counts[n.actividad] = (counts[n.actividad] ?? 0) + 1;
  }
  return ESTADOS_PROCESO.map((estado) => ({
    estado,
    label: ESTADO_PROCESO_LABEL[estado],
    count: counts[estado] ?? 0,
  })).filter((x) => x.count > 0);
}

// Resumen automático de la cartera. El análisis con IA real (texto y sugerencias
// del lado servidor) se incorpora en el Hito 2; esto deriva conclusiones de los
// propios datos para la vista de gerencia.
export function resumenCartera(): string[] {
  const k = carteraKpis();
  const ranking = rankingProductores();
  const pct = k.potencial > 0 ? Math.round((k.oportunidad / k.potencial) * 100) : 0;
  const top = ranking[0];
  const lines: string[] = [];

  lines.push(
    `La cartera reúne un potencial de ${formatUsd(k.potencial)} sobre ${k.productores} productores.`,
  );
  lines.push(
    `La oportunidad no capturada es de ${formatUsd(k.oportunidad)}, equivalente al ${pct}% del potencial total.`,
  );
  if (top) {
    lines.push(
      `${top.productor.razonSocial} es el productor de mayor potencial (${formatUsd(top.valor)}); priorizar su gestión.`,
    );
  }
  const sinActividad = productores.list().filter(
    (p) => !notasCampo.list().some((n) => n.productorId === p.id),
  );
  if (sinActividad.length > 0) {
    lines.push(
      `${sinActividad.length} productor(es) sin actividad registrada: ${sinActividad
        .map((p) => p.razonSocial)
        .join(", ")}.`,
    );
  }
  return lines;
}

function facturadoProductor(p: Productor): number {
  return p.unidades.reduce(
    (a, u) =>
      a +
      u.cultivos.reduce(
        (ac, c) => ac + c.insumos.reduce((s, i) => s + (i.facturacionAnterior || 0), 0),
        0,
      ),
    0,
  );
}

export interface ProductorRow {
  productor: Productor;
  potencial: number;
  facturado: number;
  oportunidad: number;
  captura: number;
}

export function productoresRows(): ProductorRow[] {
  return productores
    .list()
    .map((p) => {
      const potencial = valorClienteTotal(p);
      const facturado = facturadoProductor(p);
      return {
        productor: p,
        potencial,
        facturado,
        oportunidad: potencial - facturado,
        captura: potencial > 0 ? facturado / potencial : 0,
      };
    })
    .sort((a, b) => b.potencial - a.potencial);
}

export interface CultivoRow {
  cultivo: string;
  potencial: number;
  facturado: number;
  captura: number;
}

export function capturaPorCultivo(): CultivoRow[] {
  const map = new Map<string, { potencial: number; facturado: number }>();
  for (const p of productores.list()) {
    for (const u of p.unidades) {
      for (const c of u.cultivos) {
        const cur = map.get(c.cultivo) ?? { potencial: 0, facturado: 0 };
        cur.potencial += valorCultivo(c);
        cur.facturado += c.insumos.reduce((s, i) => s + (i.facturacionAnterior || 0), 0);
        map.set(c.cultivo, cur);
      }
    }
  }
  return [...map.entries()]
    .map(([cultivo, v]) => ({
      cultivo,
      potencial: v.potencial,
      facturado: v.facturado,
      captura: v.potencial > 0 ? v.facturado / v.potencial : 0,
    }))
    .sort((a, b) => b.potencial - a.potencial);
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
