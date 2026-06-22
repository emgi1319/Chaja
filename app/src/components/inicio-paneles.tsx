import { useState } from "react";
import { Info } from "lucide-react";
import { Dropdown } from "./ui";
import { formatUsd } from "../lib/valor-cliente";
import {
  formatPct,
  productoresRows,
  vendedorDetalle,
  type AlertaPanel,
  type PuntoMes,
} from "../lib/analytics";
import { notasCampo, productores } from "../lib/api";
import { ESTADO_PROCESO_LABEL, type EstadoProceso } from "../types";

export function InfoTip({ texto }: { texto: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info size={13} className="cursor-help text-ink-muted" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-56 -translate-x-1/2 rounded-xl bg-panel px-3 py-2 text-[11px] font-normal leading-snug text-white shadow-float group-hover:block">
        {texto}
      </span>
    </span>
  );
}

function MiniBars({
  data,
  format,
}: {
  data: { mes: string; valor: number }[];
  format: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <div className="flex items-end justify-between gap-3" style={{ height: 140 }}>
      {data.map((d, i) => {
        const ultimo = i === data.length - 1;
        return (
          <div key={d.mes + i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-ink-soft">{format(d.valor)}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t-md ${ultimo ? "bg-primary" : "bg-primary/35"}`}
                style={{ height: `${(d.valor / max) * 100}%`, minHeight: 4 }}
              />
            </div>
            <span className={`text-[11px] ${ultimo ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {d.mes}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SerieDrawer({
  serie,
  campo,
  format,
  nota,
}: {
  serie: PuntoMes[];
  campo: "facturado" | "clientes";
  format: (n: number) => string;
  nota: string;
}) {
  const [mes, setMes] = useState(serie[serie.length - 1]?.mes ?? "");
  const punto = serie.find((p) => p.mes === mes) ?? serie[serie.length - 1];
  const data = serie.map((p) => ({ mes: p.mes, valor: p[campo] }));
  return (
    <div className="space-y-4">
      <div className="max-w-[180px]">
        <Dropdown
          label="Período"
          value={mes}
          options={serie.map((p) => ({ value: p.mes, label: p.mes }))}
          onChange={setMes}
        />
      </div>
      <div className="card">
        <p className="text-[12px] text-ink-muted">{punto?.mes}</p>
        <p className="font-display text-[26px] font-bold text-ink">{format(punto?.[campo] ?? 0)}</p>
      </div>
      <div className="card">
        <p className="mb-3 text-[12px] font-medium text-ink-muted">Últimos 4 meses</p>
        <MiniBars data={data} format={format} />
      </div>
      <p className="text-[12px] leading-snug text-ink-muted">{nota}</p>
    </div>
  );
}

export function PanelFacturado({ serie }: { serie: PuntoMes[] }) {
  return (
    <SerieDrawer
      serie={serie}
      campo="facturado"
      format={formatUsd}
      nota="Evolución mensual de la facturación de la campaña. Elegí un mes para ver su total y comparalo con los anteriores."
    />
  );
}

export function PanelClientes({ serie }: { serie: PuntoMes[] }) {
  return (
    <SerieDrawer
      serie={serie}
      campo="clientes"
      format={(n) => String(n)}
      nota="Clientes activos mes a mes. Permite ver el crecimiento de la cartera de un vistazo."
    />
  );
}

export function PanelOportunidad() {
  const rows = productoresRows()
    .filter((r) => r.oportunidad > 0)
    .sort((a, b) => b.oportunidad - a.oportunidad)
    .slice(0, 6);
  const total = rows.reduce((a, r) => a + r.oportunidad, 0);
  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-[12px] text-ink-muted">Oportunidad total sin capturar</p>
        <p className="font-display text-[26px] font-bold text-amber">{formatUsd(total)}</p>
        <p className="mt-1 text-[12px] leading-snug text-ink-muted">
          Es la diferencia entre el potencial de cada cliente (valor cliente según la fórmula
          agronómica) y lo que efectivamente nos facturó.
        </p>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-muted">Clientes con más oportunidad</p>
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.productor.id} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2">
              <span className="text-[13px] font-medium text-ink">{r.productor.razonSocial}</span>
              <span className="text-[13px] font-semibold text-amber">{formatUsd(r.oportunidad)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PanelVendedor({ nombre }: { nombre: string }) {
  const det = vendedorDetalle(nombre);
  if (!det) return <p className="text-[13px] text-ink-muted">Sin datos de este vendedor.</p>;
  const ini = nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-tint text-[15px] font-bold text-primary-dark">
          {ini}
        </div>
        <div>
          <p className="font-display text-[16px] font-semibold text-ink">{nombre}</p>
          <p className="text-[12px] text-ink-muted">
            {det.resumen.clientes} cliente(s) · {det.resumen.hectareas} ha
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-[11px] text-ink-muted">Facturado</p>
          <p className="font-display text-[16px] font-bold text-ink">{formatUsd(det.resumen.facturado)}</p>
        </div>
        <div className="card">
          <p className="text-[11px] text-ink-muted">Oportunidad</p>
          <p className="font-display text-[16px] font-bold text-amber">{formatUsd(det.resumen.oportunidad)}</p>
        </div>
        <div className="card">
          <p className="text-[11px] text-ink-muted">Captura</p>
          <p className="font-display text-[16px] font-bold text-accent">{formatPct(det.resumen.captura)}</p>
        </div>
      </div>
      <p className="text-[12px] leading-snug text-ink-muted">
        El ranking se ordena por facturación; la captura es el facturado sobre el potencial de su cartera.
      </p>
      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-muted">Clientes de su cartera</p>
        <div className="space-y-2">
          {det.clientes.map((c) => (
            <div key={c.nombre} className="rounded-xl bg-surface px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">{c.nombre}</span>
                <span className="text-[12px] text-ink-soft">{formatUsd(c.facturado)} facturado</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Potencial {formatUsd(c.potencial)} · Oportunidad {formatUsd(c.oportunidad)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PanelAlerta({ alerta }: { alerta: AlertaPanel }) {
  const prod = alerta.clienteNombre
    ? productores.list().find((p) => p.razonSocial === alerta.clienteNombre)
    : null;
  const notas = prod
    ? notasCampo
        .list()
        .filter((n) => n.productorId === prod.id)
        .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime())
    : [];
  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-[14px] font-semibold text-ink">{alerta.titulo}</p>
        <p className="mt-1 text-[13px] text-ink-soft">{alerta.detalle}</p>
      </div>
      <div className="rounded-xl bg-surface px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">De dónde sale</p>
        <p className="mt-1 text-[12px] leading-snug text-ink-soft">{alerta.origen}</p>
      </div>
      {prod && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-muted">
            Historial de {prod.razonSocial}
          </p>
          {notas.length === 0 ? (
            <p className="text-[12px] text-ink-muted">Sin actividades registradas todavía.</p>
          ) : (
            <div className="space-y-2">
              {notas.map((n) => (
                <div key={n.id} className="rounded-xl bg-surface px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink">
                      {ESTADO_PROCESO_LABEL[n.actividad as EstadoProceso] ?? n.actividad}
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      {new Date(n.fechaContacto).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  {n.notaVisita && <p className="text-[11px] text-ink-soft">{n.notaVisita}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
