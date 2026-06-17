import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  BarChart3,
  LogOut,
  Search,
  Target,
  TrendingUp,
  ClipboardList,
  ArrowLeft,
  Plus,
  MapPin,
  Phone,
  Filter,
  Boxes,
  UserPlus,
} from "lucide-react";
import { useApp } from "../store";
import { notasCampo, operaciones, pendingTotal, productores, referidos } from "../lib/api";
import { newId } from "../lib/db";
import { Dropdown } from "../components/ui";
import { Drawer } from "../components/drawer";
import { ClienteForm } from "../components/cliente-form";
import {
  ESTADOS_PROCESO,
  ESTADO_PROCESO_LABEL,
  ESTADO_OPERACION_LABEL,
  type EstadoOperacion,
  type EstadoProceso,
  type NotaCampo,
} from "../types";
import {
  carteraKpis,
  embudo,
  productoresRows,
  capturaPorCultivo,
  resumenCartera,
  formatPct,
  seguimientoClientes,
  seguimientoStats,
  operacionesStats,
  referidosStats,
} from "../lib/analytics";
import { formatUsd, valorCultivo } from "../lib/valor-cliente";
import { DEMO_VENDEDORES } from "../lib/demo-data";

type Section =
  | "inicio"
  | "clientes"
  | "seguimiento"
  | "operaciones"
  | "referidos"
  | "equipo"
  | "productos"
  | "reportes";

const NAV: { key: Section; label: string; icon: typeof Users }[] = [
  { key: "inicio", label: "Inicio", icon: LayoutDashboard },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "seguimiento", label: "Seguimiento", icon: Filter },
  { key: "operaciones", label: "Operaciones", icon: Boxes },
  { key: "referidos", label: "Referidos", icon: UserPlus },
  { key: "equipo", label: "Equipo", icon: UserCheck },
  { key: "productos", label: "Productos", icon: Package },
  { key: "reportes", label: "Reportes", icon: BarChart3 },
];

const SECTION_TITLE: Record<Section, string> = {
  inicio: "Resumen general",
  clientes: "Clientes",
  seguimiento: "Seguimiento por cliente",
  operaciones: "Operaciones por producto",
  referidos: "Referidos",
  equipo: "Equipo de ventas",
  productos: "Productos",
  reportes: "Reportes",
};

const REF_LABEL: Record<string, string> = {
  envie_email: "Envié email",
  envie_wp: "Envié WhatsApp",
  no_contesta: "No contesta",
  respondido: "Respondido",
  visita: "Visita",
  presupuesto: "Presupuesto",
  en_proceso: "En proceso",
  no_venta: "No venta",
  venta: "Venta",
};

function EtapaBadge({ etapa }: { etapa: EstadoProceso | null }) {
  if (!etapa) return <span className="text-[12px] text-ink-muted">Sin actividad</span>;
  const tone =
    etapa === "venta" || etapa === "facturacion" || etapa === "cobranza"
      ? "bg-accent/15 text-accent-dark"
      : etapa === "no_venta"
        ? "bg-danger/10 text-danger"
        : "bg-primary/10 text-primary-dark";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-medium ${tone}`}>
      {ESTADO_PROCESO_LABEL[etapa]}
    </span>
  );
}

function OpEstadoBadge({ estado }: { estado: EstadoOperacion }) {
  const tone =
    estado === "ganada"
      ? "bg-accent/15 text-accent-dark"
      : estado === "perdida"
        ? "bg-danger/10 text-danger"
        : "bg-amber/15 text-amber";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
      {ESTADO_OPERACION_LABEL[estado]}
    </span>
  );
}

function Seguimiento() {
  const rows = seguimientoClientes();
  const s = seguimientoStats();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Users} label="Clientes" value={String(s.clientes)} />
        <Kpi icon={Target} label="Valor potencial" value={formatUsd(s.valorTotal)} tone="accent" />
        <Kpi icon={Filter} label="En proceso" value={String(s.enProceso)} />
        <Kpi icon={UserCheck} label="Ganados" value={String(s.ganados)} tone="accent" />
      </div>
      <TableShell head={["Cliente", "Vendedor", "Etapa", "Valor potencial", "Última actividad"]}>
        {rows.map((r) => (
          <tr
            key={r.productor.id}
            className="border-t border-line transition-colors hover:bg-surface"
          >
            <td className="px-4 py-3 font-medium text-ink">{r.productor.razonSocial}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.vendedor}</td>
            <td className="px-4 py-3 text-right">
              <EtapaBadge etapa={r.etapa} />
            </td>
            <td className="px-4 py-3 text-right font-semibold text-accent">{formatUsd(r.valor)}</td>
            <td className="px-4 py-3 text-right text-ink-soft">
              {formatFecha(r.ultimaFecha ?? undefined)}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function Operaciones() {
  const ops = operaciones.list();
  const s = operacionesStats();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi icon={Boxes} label="Operaciones" value={String(s.total)} />
        <Kpi icon={Target} label="Valor en juego" value={formatUsd(s.valorEnJuego)} tone="amber" />
        <Kpi icon={UserCheck} label="Ganadas" value={String(s.ganadas)} tone="accent" />
      </div>
      <TableShell head={["Cliente", "Cultivo", "Producto", "Valor", "Etapa", "Estado"]}>
        {ops.map((o) => (
          <tr key={o.id} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3 font-medium text-ink">{o.productorNombre}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{o.cultivo}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{o.producto}</td>
            <td className="px-4 py-3 text-right font-semibold text-accent">
              {formatUsd(o.valorPotencial)}
            </td>
            <td className="px-4 py-3 text-right">
              <EtapaBadge etapa={o.etapa} />
            </td>
            <td className="px-4 py-3 text-right">
              <OpEstadoBadge estado={o.estado} />
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function Referidos() {
  const rs = referidos.list();
  const s = referidosStats();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={UserPlus} label="Referidos" value={String(s.total)} />
        <Kpi icon={Filter} label="En gestión" value={String(s.enGestion)} />
        <Kpi icon={UserCheck} label="Ventas" value={String(s.ventas)} tone="accent" />
        <Kpi icon={TrendingUp} label="Conversión" value={formatPct(s.conversion)} tone="accent" />
      </div>
      <TableShell head={["Referido", "Referidor", "Estado", "Contacto"]}>
        {rs.map((r) => (
          <tr key={r.id} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3 font-medium text-ink">{r.nombre}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.referidor || "—"}</td>
            <td className="px-4 py-3 text-right">
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                {REF_LABEL[r.proceso] ?? r.proceso}
              </span>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.movil || r.email || "—"}</td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function Bar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "accent" | "amber" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  const color = tone === "accent" ? "bg-accent" : tone === "amber" ? "bg-amber" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-line">
      <div
        className={`h-2 rounded-pill transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(100, Math.max(2, w))}%` }}
      />
    </div>
  );
}

function CapturaBadge({ pct }: { pct: number }) {
  const tone =
    pct >= 0.7
      ? "bg-accent/15 text-accent-dark"
      : pct >= 0.4
        ? "bg-amber/15 text-amber"
        : "bg-danger/10 text-danger";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
      {formatPct(pct)}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "ink",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "ink" | "accent" | "amber";
}) {
  const color = tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber" : "text-ink";
  return (
    <div className="card card-hover">
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon size={16} />
        <span className="text-[12px]">{label}</span>
      </div>
      <p className={`mt-2 font-display text-[22px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

function TableShell({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-[13px]">
        <thead className="bg-surface text-left text-ink-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Inicio() {
  const k = carteraKpis();
  const rows = productoresRows().slice(0, 6);
  const funnel = embudo();
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const analisis = resumenCartera();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Users} label="Clientes" value={String(k.productores)} />
        <Kpi icon={Target} label="Potencial de cartera" value={formatUsd(k.potencial)} />
        <Kpi icon={TrendingUp} label="Oportunidad" value={formatUsd(k.oportunidad)} tone="amber" />
        <Kpi icon={ClipboardList} label="Actividades" value={String(k.notas)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-display text-[15px] font-semibold text-ink">Top clientes por potencial</h2>
          <table className="mt-3 w-full text-[13px]">
            <tbody>
              {rows.map((r) => (
                <tr key={r.productor.id} className="border-t border-line">
                  <td className="py-2">
                    <p className="font-medium text-ink">{r.productor.razonSocial}</p>
                    <p className="text-[11px] text-ink-muted">{r.productor.localidad || "—"}</p>
                  </td>
                  <td className="py-2 text-right font-semibold text-accent">{formatUsd(r.potencial)}</td>
                  <td className="py-2 pl-3 text-right">
                    <CapturaBadge pct={r.captura} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2 className="font-display text-[15px] font-semibold text-ink">Embudo del proceso</h2>
          <div className="mt-3 space-y-2.5">
            {funnel.map((f) => (
              <div key={f.estado}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-ink-soft">{f.label}</span>
                  <span className="text-ink-muted">{f.count}</span>
                </div>
                <Bar pct={(f.count / maxFunnel) * 100} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Análisis de la cartera</h2>
        <ul className="mt-3 space-y-2">
          {analisis.map((line, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-ink-soft">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function formatFecha(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ClienteDetalle({ id, onBack }: { id: string; onBack: () => void }) {
  const [, bump] = useState(0);
  const productor = productores.get(id);
  const row = productoresRows().find((r) => r.productor.id === id);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [actividad, setActividad] = useState<EstadoProceso>("inicio_contacto");
  const [nota, setNota] = useState("");
  const [saving, setSaving] = useState(false);

  if (!productor || !row) return null;

  const notas = notasCampo
    .list()
    .filter((n) => n.productorId === id)
    .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime());

  const primera = notas[notas.length - 1];
  const venta = notas.find((n) => n.actividad === "venta");
  const cultivos = productor.unidades.flatMap((u) => u.cultivos);

  const agregar = async () => {
    setSaving(true);
    const nueva: NotaCampo = {
      id: newId(),
      fechaContacto: new Date(`${fecha}T12:00:00`).toISOString(),
      productorId: id,
      productorNombre: productor.razonSocial,
      actividad,
      notaVisita: nota,
      updatedAt: Date.now(),
    };
    await notasCampo.save(nueva);
    setNota("");
    setSaving(false);
    bump((v) => v + 1);
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Volver a clientes
      </button>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4">
          <section className="card">
            <h2 className="font-display text-[17px] font-semibold text-ink">
              {productor.razonSocial}
            </h2>
            <div className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
              {productor.localidad && (
                <p className="flex items-center gap-2">
                  <MapPin size={14} className="text-ink-muted" />
                  {productor.localidad}
                </p>
              )}
              {(productor.celular || productor.telefono) && (
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-ink-muted" />
                  {productor.celular || productor.telefono}
                </p>
              )}
              {productor.email && <p className="text-ink-muted">{productor.email}</p>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[12px]">
              <div>
                <p className="text-ink-muted">Potencial</p>
                <p className="font-semibold text-accent">{formatUsd(row.potencial)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Facturado</p>
                <p className="font-semibold text-ink">{formatUsd(row.facturado)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Oportunidad</p>
                <p className="font-semibold text-amber">{formatUsd(row.oportunidad)}</p>
              </div>
              <div>
                <p className="text-ink-muted">Captura</p>
                <p className="font-semibold text-ink">{formatPct(row.captura)}</p>
              </div>
            </div>
          </section>

          <section className="card text-[13px]">
            <h3 className="font-display text-[14px] font-semibold text-ink">Fechas clave</h3>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Primer contacto</dt>
                <dd className="text-ink-soft">{formatFecha(primera?.fechaContacto)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Última actividad</dt>
                <dd className="text-ink-soft">{formatFecha(notas[0]?.fechaContacto)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Estado actual</dt>
                <dd className="font-medium text-ink">
                  {notas[0] ? ESTADO_PROCESO_LABEL[notas[0].actividad] : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Cierre / venta</dt>
                <dd className="text-ink-soft">{formatFecha(venta?.fechaContacto)}</dd>
              </div>
            </dl>
          </section>

          {cultivos.length > 0 && (
            <section className="card text-[13px]">
              <h3 className="font-display text-[14px] font-semibold text-ink">Cultivos</h3>
              <table className="mt-2 w-full">
                <tbody>
                  {cultivos.map((c) => (
                    <tr key={c.id} className="border-t border-line first:border-0">
                      <td className="py-1.5 text-ink-soft">
                        {c.cultivo}
                        <span className="text-ink-muted"> · {c.superficieHa} ha</span>
                      </td>
                      <td className="py-1.5 text-right font-semibold text-accent">
                        {formatUsd(valorCultivo(c))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <section className="card">
            <h3 className="font-display text-[14px] font-semibold text-ink">Registrar actividad</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="label">Fecha</span>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="field"
                />
              </label>
              <Dropdown
                label="Actividad"
                value={actividad}
                onChange={setActividad}
                options={ESTADOS_PROCESO.map((e) => ({ value: e, label: ESTADO_PROCESO_LABEL[e] }))}
              />
            </div>
            <label className="mt-3 block space-y-1.5">
              <span className="label">Nota</span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                placeholder="Qué se habló o acordó"
                className="field"
              />
            </label>
            <button
              onClick={agregar}
              disabled={saving}
              className="press mt-3 rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-disabled"
            >
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> Agregar al historial
              </span>
            </button>
          </section>

          <section className="card">
            <h3 className="font-display text-[14px] font-semibold text-ink">Historial</h3>
            {notas.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-muted">Sin actividades registradas todavía.</p>
            ) : (
              <ol className="mt-3">
                {notas.map((n, i) => (
                  <li key={n.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          n.actividad === "venta"
                            ? "bg-accent"
                            : n.actividad === "no_venta"
                              ? "bg-danger"
                              : "bg-primary"
                        }`}
                      />
                      {i < notas.length - 1 && <span className="w-px flex-1 bg-line" />}
                    </div>
                    <div className="-mt-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-ink">
                          {ESTADO_PROCESO_LABEL[n.actividad]}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {formatFecha(n.fechaContacto)}
                        </span>
                      </div>
                      {n.notaVisita && <p className="text-[12px] text-ink-soft">{n.notaVisita}</p>}
                      {!n.synced && (
                        <span className="text-[10px] text-amber">pendiente de sincronizar</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Clientes() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const all = useMemo(() => productoresRows(), [version]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter(
      (r) =>
        r.productor.razonSocial.toLowerCase().includes(t) ||
        (r.productor.localidad ?? "").toLowerCase().includes(t),
    );
  }, [q, all]);

  if (selected) return <ClienteDetalle id={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-transparent bg-white px-3 shadow-card transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
          <Search size={18} className="text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente"
            className="w-full bg-transparent py-2.5 text-[14px] outline-none"
          />
        </div>
        <button
          onClick={() => setNuevoOpen(true)}
          className="press flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Plus size={17} /> Nuevo cliente
        </button>
      </div>

      <TableShell head={["Cliente", "Potencial", "Facturado", "Oportunidad", "% captura"]}>
        {rows.map((r) => (
          <tr
            key={r.productor.id}
            onClick={() => setSelected(r.productor.id)}
            className="cursor-pointer border-t border-line transition-colors hover:bg-surface"
          >
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{r.productor.razonSocial}</p>
              <p className="text-[11px] text-ink-muted">{r.productor.localidad || "—"}</p>
            </td>
            <td className="px-4 py-3 text-right font-semibold text-accent">{formatUsd(r.potencial)}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{formatUsd(r.facturado)}</td>
            <td className="px-4 py-3 text-right text-amber">{formatUsd(r.oportunidad)}</td>
            <td className="px-4 py-3 text-right">
              <CapturaBadge pct={r.captura} />
            </td>
          </tr>
        ))}
      </TableShell>

      <Drawer open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo cliente">
        <ClienteForm
          onSaved={() => {
            setNuevoOpen(false);
            setVersion((v) => v + 1);
          }}
        />
      </Drawer>
    </div>
  );
}

function Equipo() {
  return (
    <TableShell head={["Vendedor", "Objetivo", "Logrado", "Cumplimiento", "Referidos"]}>
      {DEMO_VENDEDORES.map((v) => {
        const pct = v.logrado / v.objetivo;
        return (
          <tr key={v.nombre} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3 font-medium text-ink">{v.nombre}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{formatUsd(v.objetivo)}</td>
            <td className="px-4 py-3 text-right font-semibold text-accent">{formatUsd(v.logrado)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-2">
                <div className="w-28">
                  <Bar pct={pct * 100} tone={pct >= 0.8 ? "accent" : "amber"} />
                </div>
                <span className="w-10 text-right text-[12px] text-ink-muted">{formatPct(pct)}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{v.referidos}</td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function Productos() {
  const catalogo = useApp((s) => s.catalogo);
  return (
    <TableShell head={["Producto", "Empresa", "Presentación", "Precio", "Stock"]}>
      {catalogo.map((p) => (
        <tr key={p.id} className="border-t border-line transition-colors hover:bg-surface">
          <td className="px-4 py-3">
            <p className="font-medium text-ink">{p.nombre}</p>
            <p className="text-[11px] text-ink-muted">{p.principioActivo || "—"}</p>
          </td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.empresa || "—"}</td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.presentacion || "—"}</td>
          <td className="px-4 py-3 text-right font-semibold text-accent">
            {p.precio1 != null ? formatUsd(p.precio1) : "—"}
          </td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.stock ?? "—"}</td>
        </tr>
      ))}
    </TableShell>
  );
}

function Reportes() {
  const cultivos = capturaPorCultivo();
  const maxPot = Math.max(1, ...cultivos.map((c) => c.potencial));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Captura por cultivo</h2>
        <div className="mt-3 space-y-3">
          {cultivos.map((c) => (
            <div key={c.cultivo}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-ink-soft">{c.cultivo}</span>
                <span className="text-ink-muted">
                  {formatUsd(c.facturado)} / {formatUsd(c.potencial)} · {formatPct(c.captura)}
                </span>
              </div>
              <Bar pct={(c.potencial / maxPot) * 100} tone="accent" />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">
          Cumplimiento por vendedor
        </h2>
        <div className="mt-3 space-y-4">
          {DEMO_VENDEDORES.map((v) => {
            const pct = v.logrado / v.objetivo;
            return (
              <div key={v.nombre}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink">{v.nombre}</span>
                  <span className="text-ink-muted">{formatPct(pct)}</span>
                </div>
                <Bar pct={pct * 100} tone={pct >= 0.8 ? "accent" : "amber"} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function Dashboard() {
  const user = useApp((s) => s.user)!;
  const logout = useApp((s) => s.logout);
  const [section, setSection] = useState<Section>("inicio");
  const dataVersion = useApp((s) => s.dataVersion);
  const pend = pendingTotal();

  return (
    <div className="flex h-full bg-surface">
      <aside className="flex w-16 shrink-0 flex-col bg-panel text-white md:w-60">
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 font-display text-[18px] font-bold">
            C
          </div>
          <span className="hidden font-display text-[18px] font-bold md:inline">CHAJÁ</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-2">
          {NAV.map((n) => {
            const active = n.key === section;
            return (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                  active ? "bg-white/15 font-semibold text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <n.icon size={19} className="shrink-0" />
                <span className="hidden md:inline">{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="hidden min-w-0 flex-1 md:block">
              <p className="truncate text-[13px] font-medium">{user.nombre}</p>
              <p className="text-[11px] capitalize text-white/55">{user.rol}</p>
            </div>
            <button onClick={logout} aria-label="Salir" className="text-white/65 hover:text-white">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h1 className="font-display text-[20px] font-semibold text-ink">{SECTION_TITLE[section]}</h1>
          {pend > 0 && (
            <span className="rounded-pill bg-primary-tint px-3 py-1 text-[12px] font-medium text-primary-dark">
              {pend} sin sincronizar
            </span>
          )}
        </header>
        <main key={`${section}-${dataVersion}`} className="fade-in flex-1 overflow-y-auto p-6">
          {section === "inicio" && <Inicio />}
          {section === "clientes" && <Clientes />}
          {section === "seguimiento" && <Seguimiento />}
          {section === "operaciones" && <Operaciones />}
          {section === "referidos" && <Referidos />}
          {section === "equipo" && <Equipo />}
          {section === "productos" && <Productos />}
          {section === "reportes" && <Reportes />}
        </main>
      </div>
    </div>
  );
}
