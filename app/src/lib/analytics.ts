import { notasCampo, operaciones, productores, referidos } from "./api";
import {
  diferenciaTotal,
  facturadoCliente,
  facturadoCultivo,
  formatUsd,
  valorClienteTotal,
  valorCultivo,
} from "./valor-cliente";
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

export interface ProductorRow {
  productor: Productor;
  potencial: number;
  facturado: number;
  oportunidad: number;
  captura: number;
  hectareas: number;
}

export function productoresRows(): ProductorRow[] {
  return productores
    .list()
    .map((p) => {
      const potencial = valorClienteTotal(p);
      const facturado = facturadoCliente(p);
      const hectareas = p.unidades.reduce(
        (a, u) => a + u.cultivos.reduce((ac, c) => ac + (c.superficieHa || 0), 0),
        0,
      );
      return {
        productor: p,
        potencial,
        facturado,
        oportunidad: potencial - facturado,
        captura: potencial > 0 ? facturado / potencial : 0,
        hectareas,
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
        cur.facturado += facturadoCultivo(c);
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

export interface SeguimientoRow {
  productor: Productor;
  etapa: EstadoProceso | null;
  valor: number;
  vendedor: string;
  ultimaFecha: string | null;
}

export function seguimientoClientes(): SeguimientoRow[] {
  const notas = notasCampo.list();
  return productores
    .list()
    .map((p) => {
      const ns = notas
        .filter((n) => n.productorId === p.id)
        .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime());
      const ultima = ns[0];
      return {
        productor: p,
        etapa: ultima ? ultima.actividad : null,
        valor: valorClienteTotal(p),
        vendedor: ultima?.creadoPor ?? p.creadoPor ?? "—",
        ultimaFecha: ultima?.fechaContacto ?? null,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

export function seguimientoStats() {
  const rows = seguimientoClientes();
  const enProceso = rows.filter(
    (r) => r.etapa && !["venta", "no_venta", "cobranza"].includes(r.etapa),
  ).length;
  const ganados = rows.filter((r) => r.etapa === "venta" || r.etapa === "facturacion").length;
  return {
    clientes: rows.length,
    valorTotal: rows.reduce((a, r) => a + r.valor, 0),
    enProceso,
    ganados,
  };
}

export function operacionesStats() {
  const ops = operaciones.list();
  return {
    total: ops.length,
    valorEnJuego: ops
      .filter((o) => o.estado === "abierta")
      .reduce((a, o) => a + o.valorPotencial, 0),
    ganadas: ops.filter((o) => o.estado === "ganada").length,
  };
}

export function referidosStats() {
  const rs = referidos.list();
  const ventas = rs.filter((r) => r.proceso === "venta").length;
  const cerrados = rs.filter((r) => r.proceso === "venta" || r.proceso === "no_venta").length;
  return {
    total: rs.length,
    enGestion: rs.filter((r) => r.proceso !== "venta" && r.proceso !== "no_venta").length,
    ventas,
    conversion: cerrados > 0 ? ventas / cerrados : 0,
  };
}

export interface CampaignTotals {
  clientes: number;
  facturado: number;
  potencial: number;
  oportunidad: number;
  captura: number;
}

export function campaignTotals(): CampaignTotals {
  const rows = productoresRows();
  const facturado = rows.reduce((a, r) => a + r.facturado, 0);
  const potencial = rows.reduce((a, r) => a + r.potencial, 0);
  const oportunidad = rows.reduce((a, r) => a + r.oportunidad, 0);
  return {
    clientes: rows.length,
    facturado,
    potencial,
    oportunidad,
    captura: potencial > 0 ? facturado / potencial : 0,
  };
}

export interface VendedorResumen {
  vendedor: string;
  clientes: number;
  hectareas: number;
  facturado: number;
  potencial: number;
  oportunidad: number;
  captura: number;
}

export function vendedoresResumen(): VendedorResumen[] {
  const map = new Map<string, VendedorResumen>();
  for (const r of productoresRows()) {
    const v = r.productor.vendedor || "Sin asignar";
    const cur =
      map.get(v) ??
      { vendedor: v, clientes: 0, hectareas: 0, facturado: 0, potencial: 0, oportunidad: 0, captura: 0 };
    cur.clientes += 1;
    cur.hectareas += r.hectareas;
    cur.facturado += r.facturado;
    cur.potencial += r.potencial;
    cur.oportunidad += r.oportunidad;
    map.set(v, cur);
  }
  return [...map.values()]
    .map((v) => ({ ...v, captura: v.potencial > 0 ? v.facturado / v.potencial : 0 }))
    .sort((a, b) => b.facturado - a.facturado);
}

const PROXIMA_ACCION: Record<string, string> = {
  inicio_contacto: "Agendar reunión",
  completar_datos: "Completar la ficha",
  agenda_visita: "Coordinar visita",
  visita_campo: "Enviar asesoría",
  reunion_oficina: "Pasar a presupuesto",
  asesoria: "Armar presupuesto",
  presupuesto: "Seguir presupuesto enviado",
  en_proceso: "Avanzar negociación",
  negociacion: "Cerrar condiciones",
  venta: "Coordinar entrega",
  no_venta: "Reactivar más adelante",
  facturacion: "Gestionar cobranza",
  cobranza: "Cerrar cobranza",
  otros: "Definir próximo paso",
};

export function proximaAccion(etapa: string | null): string {
  return etapa ? (PROXIMA_ACCION[etapa] ?? "Definir próximo paso") : "Iniciar contacto";
}

export interface AlertaPanel {
  nivel: "alta" | "media" | "info";
  titulo: string;
  detalle: string;
}

export function alertasPanel(): AlertaPanel[] {
  const rows = productoresRows();
  const notas = notasCampo.list();
  const out: AlertaPanel[] = [];

  const porOportunidad = [...rows]
    .filter((r) => r.oportunidad > 0)
    .sort((a, b) => b.oportunidad - a.oportunidad)[0];
  if (porOportunidad) {
    out.push({
      nivel: "alta",
      titulo: "Oportunidad sin capturar",
      detalle: `${porOportunidad.productor.razonSocial} tiene ${formatUsd(porOportunidad.oportunidad)} de potencial todavía sin vender.`,
    });
  }

  const sinSeguimiento = rows.filter(
    (r) => !notas.some((n) => n.productorId === r.productor.id),
  );
  if (sinSeguimiento.length > 0) {
    const nombres = sinSeguimiento.slice(0, 2).map((r) => r.productor.razonSocial).join(", ");
    out.push({
      nivel: "media",
      titulo: "Clientes sin seguimiento",
      detalle: `${sinSeguimiento.length} cliente(s) sin actividad registrada: ${nombres}${sinSeguimiento.length > 2 ? "…" : ""}.`,
    });
  }

  const bajaCaptura = [...rows]
    .filter((r) => r.potencial > 0)
    .sort((a, b) => a.captura - b.captura)[0];
  if (bajaCaptura && bajaCaptura.captura < 0.6) {
    out.push({
      nivel: "media",
      titulo: "Baja captura",
      detalle: `${bajaCaptura.productor.razonSocial} está en ${formatPct(bajaCaptura.captura)} de su potencial — conviene visitarlo.`,
    });
  }

  const enProceso = notas.filter((n) =>
    ["presupuesto", "negociacion", "en_proceso"].includes(n.actividad),
  ).length;
  if (enProceso > 0) {
    out.push({
      nivel: "info",
      titulo: "Negociaciones abiertas",
      detalle: `${enProceso} operación(es) en proceso o con presupuesto enviado para seguir.`,
    });
  }

  return out;
}

export function alertasCartera(): string[] {
  const rows = productoresRows().filter((r) => r.potencial > 0);
  const out: string[] = [];
  const porOportunidad = [...rows].sort((a, b) => b.oportunidad - a.oportunidad)[0];
  if (porOportunidad) {
    out.push(
      `${porOportunidad.productor.razonSocial} tiene ${formatUsd(porOportunidad.oportunidad)} de oportunidad sin capturar`,
    );
  }
  const porCaptura = [...rows].sort((a, b) => a.captura - b.captura)[0];
  if (porCaptura) {
    out.push(
      `${porCaptura.productor.razonSocial} está en ${formatPct(porCaptura.captura)} de captura — conviene revisar`,
    );
  }
  return out;
}
