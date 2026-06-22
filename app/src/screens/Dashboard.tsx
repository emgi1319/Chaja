import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
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
  DollarSign,
  Clock,
  ArrowLeft,
  Plus,
  Filter,
  Boxes,
  UserPlus,
  Calculator,
  Sliders,
  ClipboardCheck,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Gauge,
  AlertTriangle,
  Info,
  Sprout,
  Activity,
  Calendar,
} from "lucide-react";
import { useApp } from "../store";
import { notasCampo, operaciones, pendingTotal, productores, referidos, saveProducto } from "../lib/api";
import { newId } from "../lib/db";
import { Dropdown, Field, PrimaryButton } from "../components/ui";
import { Drawer } from "../components/drawer";
import { ClienteForm } from "../components/cliente-form";
import { CargarActividad } from "../components/cargar-actividad";
import { FormulaAgronomica } from "../components/formula-agronomica";
import {
  CULTIVOS,
  ESTADOS_REFERIDO,
  ESTADO_PROCESO_LABEL,
  ESTADO_OPERACION_LABEL,
  type Campania,
  type Cultivo,
  type EstadoOperacion,
  type EstadoProceso,
  type InsumoLinea,
  type Referido,
} from "../types";
import {
  productoresRows,
  capturaPorCultivo,
  formatPct,
  seguimientoClientes,
  seguimientoStats,
  operacionesStats,
  referidosStats,
  campaignTotals,
  alertasPanel,
  vendedoresResumen,
  proximaAccion,
  supervisorVendedores,
  supervisorStats,
  campEstado,
} from "../lib/analytics";
import {
  formatUsd,
  valorCultivo,
  facturadoCultivo,
  oportunidadCultivo,
  inversionInsumo,
} from "../lib/valor-cliente";
import {
  setCostosHa,
  getConfig,
  getObjetivoCampania,
  getNombreCampania,
  setObjetivoCampania,
  setNombreCampania,
  getCampanias,
  setCampanias,
} from "../lib/parametros";

type Section =
  | "inicio"
  | "clientes"
  | "seguimiento"
  | "operaciones"
  | "referidos"
  | "actividad"
  | "equipo"
  | "productos"
  | "valorcliente"
  | "parametros"
  | "reportes"
  | "supervisor";

const NAV: { key: Section; label: string; icon: typeof Users }[] = [
  { key: "inicio", label: "Inicio", icon: LayoutDashboard },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "seguimiento", label: "Seguimiento", icon: Filter },
  { key: "operaciones", label: "Operaciones", icon: Boxes },
  { key: "referidos", label: "Referidos", icon: UserPlus },
  { key: "actividad", label: "Cargar actividad", icon: ClipboardCheck },
  { key: "equipo", label: "Equipo", icon: UserCheck },
  { key: "productos", label: "Productos", icon: Package },
  { key: "valorcliente", label: "Valor cliente", icon: Calculator },
  { key: "parametros", label: "Parámetros", icon: Sliders },
  { key: "reportes", label: "Reportes", icon: BarChart3 },
  { key: "supervisor", label: "Panel supervisor", icon: Activity },
];

// Secciones visibles por perfil (el gerente ve todo). El supervisor no carga
// clientes ni actividad; el vendedor no ve equipo, reportes ni parámetros.
const RAIL_VEND: Section[] = [
  "inicio",
  "clientes",
  "valorcliente",
  "actividad",
  "seguimiento",
  "operaciones",
  "referidos",
  "productos",
];
const RAIL_SUP: Section[] = [
  "inicio",
  "seguimiento",
  "operaciones",
  "reportes",
  "supervisor",
  "equipo",
  "productos",
];

const SECTION_TITLE: Record<Section, string> = {
  inicio: "Resumen general",
  clientes: "Clientes",
  seguimiento: "Seguimiento por cliente",
  operaciones: "Operaciones por producto",
  referidos: "Referidos",
  actividad: "Cargar actividad",
  equipo: "Equipo de ventas",
  productos: "Productos",
  valorcliente: "Valor cliente",
  parametros: "Parámetros",
  reportes: "Reportes",
  supervisor: "Panel del supervisor",
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
      <TableShell head={["Cliente", "Vendedor", "Etapa", "Valor potencial", "Próxima acción"]}>
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
            <td className="px-4 py-3 text-right text-ink-soft">{proximaAccion(r.etapa)}</td>
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
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{o.productorNombre}</p>
              <p className="text-[11px] uppercase text-ink-muted">{o.id}</p>
            </td>
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

const CATEGORIAS = [
  "Semilla",
  "Herbicida",
  "Fungicida",
  "Insecticida",
  "Fertilizante",
  "Coadyuvante",
  "Inoculante",
  "Curasemilla",
  "Otros",
];

function numv(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function ReferidoForm({ onSaved }: { onSaved: () => void }) {
  const user = useApp((s) => s.user);
  const [nombre, setNombre] = useState("");
  const [referidor, setReferidor] = useState("");
  const [email, setEmail] = useState("");
  const [movil, setMovil] = useState("");
  const [proceso, setProceso] = useState<string>("envie_email");
  const [observaciones, setObservaciones] = useState("");
  const [cultivos, setCultivos] = useState<{ id: string; cultivo: string; ha: string }[]>([
    { id: newId(), cultivo: "Maíz", ha: "" },
  ]);
  const [estadoCivil, setEstadoCivil] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [hobbys, setHobbys] = useState("");
  const [deportes, setDeportes] = useState("");
  const [saving, setSaving] = useState(false);
  const haTotal = cultivos.reduce((a, c) => a + numv(c.ha), 0);
  const valorPotencial = cultivos.reduce(
    (a, c) => a + valorCultivo({ id: c.id, cultivo: c.cultivo, superficieHa: numv(c.ha), facturado: 0 }),
    0,
  );
  const patchCultivo = (id: string, p: Partial<{ cultivo: string; ha: string }>) =>
    setCultivos((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const guardar = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    await referidos.save({
      id: newId(),
      nombre: nombre.trim(),
      referidor,
      email,
      movil,
      proceso: proceso as Referido["proceso"],
      observaciones,
      hectareas: haTotal,
      estadoCivil,
      fechaNacimiento,
      hobbys,
      deportes,
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    });
    setSaving(false);
    onSaved();
  };
  return (
    <div className="space-y-3">
      <Field label="Nombre y apellido" value={nombre} onChange={setNombre} />
      <Field label="Referidor" value={referidor} onChange={setReferidor} />
      <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
      <Field label="Móvil" value={movil} onChange={setMovil} inputMode="tel" />
      <label className="block space-y-1.5">
        <span className="label">Fecha de nacimiento</span>
        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          className="field"
        />
      </label>
      <Field label="Estado civil" value={estadoCivil} onChange={setEstadoCivil} />
      <Dropdown
        label="Proceso"
        value={proceso}
        options={ESTADOS_REFERIDO.map((e) => ({ value: e as string, label: REF_LABEL[e] ?? e }))}
        onChange={setProceso}
      />
      <div className="space-y-2 rounded-2xl border border-line p-3">
        <div className="flex items-center justify-between">
          <span className="label">Cultivos</span>
          <button
            type="button"
            onClick={() => setCultivos((cs) => [...cs, { id: newId(), cultivo: "Maíz", ha: "" }])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
        {cultivos.map((c) => (
          <div key={c.id} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-6">
              <Dropdown
                value={c.cultivo}
                options={CULTIVOS.map((x) => ({ value: x as string, label: x }))}
                onChange={(v) => patchCultivo(c.id, { cultivo: v })}
              />
            </div>
            <input
              value={c.ha}
              onChange={(e) => patchCultivo(c.id, { ha: e.target.value })}
              placeholder="Ha"
              inputMode="decimal"
              className="col-span-3 rounded-xl bg-surface px-2 py-2.5 text-right text-[13px] outline-none"
            />
            <span className="col-span-2 text-right text-[12px] font-semibold text-accent">
              {formatUsd(
                valorCultivo({ id: c.id, cultivo: c.cultivo, superficieHa: numv(c.ha), facturado: 0 }),
              )}
            </span>
            <button
              type="button"
              onClick={() => setCultivos((cs) => (cs.length > 1 ? cs.filter((x) => x.id !== c.id) : cs))}
              className="col-span-1 p-1 text-ink-muted active:opacity-60"
              aria-label="Quitar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-2 text-[13px]">
          <span className="text-ink-muted">{haTotal} ha · valor potencial</span>
          <span className="font-semibold text-accent">{formatUsd(valorPotencial)}</span>
        </div>
      </div>
      <Field label="Hobbys" value={hobbys} onChange={setHobbys} />
      <Field label="Deportes" value={deportes} onChange={setDeportes} />
      <label className="block space-y-1.5">
        <span className="label">Observaciones</span>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="field"
        />
      </label>
      <PrimaryButton disabled={saving || !nombre.trim()} onClick={guardar}>
        {saving ? "Guardando…" : "Guardar referido"}
      </PrimaryButton>
    </div>
  );
}

function ProductoForm({ onSaved }: { onSaved: () => void }) {
  const refresh = useApp((s) => s.refresh);
  const [codigo, setCodigo] = useState("");
  const [categoria, setCategoria] = useState<string>("Semilla");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const guardar = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    await saveProducto({
      id: newId(),
      codigo,
      categoria,
      nombre: nombre.trim(),
      empresa,
      presentacion,
      precio1: numv(precio),
      stock: numv(stock),
    });
    await refresh();
    setSaving(false);
    onSaved();
  };
  return (
    <div className="space-y-3">
      <Field label="Código" value={codigo} onChange={setCodigo} />
      <Dropdown
        label="Categoría"
        value={categoria}
        options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
        onChange={setCategoria}
      />
      <Field label="Nombre" value={nombre} onChange={setNombre} />
      <Field label="Marca" value={empresa} onChange={setEmpresa} />
      <Field label="Presentación" value={presentacion} onChange={setPresentacion} />
      <Field label="Precio (U$S)" value={precio} onChange={setPrecio} inputMode="decimal" />
      <Field label="Stock" value={stock} onChange={setStock} inputMode="numeric" />
      <PrimaryButton disabled={saving || !nombre.trim()} onClick={guardar}>
        {saving ? "Guardando…" : "Guardar producto"}
      </PrimaryButton>
    </div>
  );
}

function Referidos() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const rs = useMemo(() => referidos.list(), [version]);
  const s = useMemo(() => referidosStats(), [version]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={UserPlus} label="Referidos" value={String(s.total)} />
        <Kpi icon={Filter} label="En gestión" value={String(s.enGestion)} />
        <Kpi icon={UserCheck} label="Ventas" value={String(s.ventas)} tone="accent" />
        <Kpi icon={TrendingUp} label="Conversión" value={formatPct(s.conversion)} tone="accent" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Plus size={17} /> Nuevo referido
        </button>
      </div>
      <TableShell head={["Referido", "Referidor", "Proceso", "Ha"]}>
        {rs.map((r) => (
          <tr key={r.id} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{r.nombre}</p>
              {r.observaciones && <p className="text-[11px] text-ink-muted">{r.observaciones}</p>}
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.referidor || "—"}</td>
            <td className="px-4 py-3 text-right">
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                {REF_LABEL[r.proceso] ?? r.proceso}
              </span>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.hectareas ?? "—"}</td>
          </tr>
        ))}
      </TableShell>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nuevo referido">
        <ReferidoForm
          onSaved={() => {
            setOpen(false);
            setVersion((v) => v + 1);
          }}
        />
      </Drawer>
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
  const valueColor = tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber" : "text-ink";
  const chip =
    tone === "accent"
      ? "bg-accent/10 text-accent"
      : tone === "amber"
        ? "bg-amber/10 text-amber"
        : "bg-primary/10 text-primary";
  return (
    <div className="card card-hover flex items-center gap-3.5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-ink-muted">{label}</p>
        <p className={`font-display text-[23px] font-bold leading-tight ${valueColor}`}>{value}</p>
      </div>
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
  const t = campaignTotals();
  const objetivo = getObjetivoCampania() || t.potencial;
  const avance = objetivo > 0 ? t.facturado / objetivo : 0;
  const alertas = alertasPanel();
  const ranking = vendedoresResumen();
  const maxFact = Math.max(1, ...ranking.map((v) => v.facturado));
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const refresh = useApp((s) => s.refresh);
  const user = useApp((s) => s.user);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[18px] font-semibold text-ink">
            Panel de la campaña {getNombreCampania()}
          </h2>
          <p className="text-[13px] text-ink-muted">
            Cómo viene la campaña y dónde están las oportunidades de tu cartera.
          </p>
        </div>
        {user?.rol !== "supervisor" && (
          <button
            onClick={() => setNuevoOpen(true)}
            className="press flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={17} /> Nuevo cliente
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={DollarSign} label="Facturado campaña" value={formatUsd(t.facturado)} />
        <Kpi icon={TrendingUp} label="Oportunidad detectada" value={formatUsd(t.oportunidad)} tone="amber" />
        <Kpi icon={Gauge} label="% capturado" value={formatPct(t.captura)} />
        <Kpi icon={Users} label="Clientes activos" value={String(t.clientes)} />
      </div>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-ink">Objetivo de campaña</h2>
          <span className="text-[13px] text-ink-muted">
            {formatUsd(t.facturado)} / {formatUsd(objetivo)}
          </span>
        </div>
        <div className="mt-3">
          <Bar pct={avance * 100} tone="accent" />
        </div>
        <p className="mt-1.5 text-[12px] text-ink-muted">{formatPct(avance)} del objetivo alcanzado</p>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Ranking de vendedores</h2>
        <div className="mt-3 space-y-3">
          {ranking.map((v) => {
            const ini = v.vendedor
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={v.vendedor} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[12px] font-semibold text-primary-dark">
                  {ini}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{v.vendedor}</span>
                    <span className="text-ink-muted">
                      {formatUsd(v.facturado)} · {formatPct(v.captura)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Bar pct={(v.facturado / maxFact) * 100} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">
          Alertas y próximas acciones
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {alertas.map((a, i) => {
            const style =
              a.nivel === "alta"
                ? { border: "border-l-danger", chip: "bg-danger/10 text-danger", Icon: AlertTriangle }
                : a.nivel === "media"
                  ? { border: "border-l-amber", chip: "bg-amber/10 text-amber", Icon: Clock }
                  : { border: "border-l-primary", chip: "bg-primary/10 text-primary", Icon: Info };
            return (
              <div key={i} className={`card flex items-start gap-3 border-l-4 ${style.border}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.chip}`}>
                  <style.Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{a.titulo}</p>
                  <p className="text-[12px] leading-snug text-ink-soft">{a.detalle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Drawer open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo cliente">
        <ClienteForm
          onSaved={() => {
            setNuevoOpen(false);
            void refresh();
          }}
        />
      </Drawer>
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
  const productor = productores.get(id);
  const row = productoresRows().find((r) => r.productor.id === id);
  const [histOpen, setHistOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [, bump] = useState(0);

  if (!productor || !row) return null;

  const notas = notasCampo
    .list()
    .filter((n) => n.productorId === id)
    .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime());
  const cultivos = productor.unidades.flatMap((u) => u.cultivos);
  const inicial = productor.razonSocial
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const meta = [
    productor.localidad,
    row.hectareas ? `${row.hectareas} ha` : null,
    productor.vendedor ? `Vendedor: ${productor.vendedor}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const kpis: { label: string; value: string; tone?: "amber" }[] = [
    { label: "Valor potencial", value: formatUsd(row.potencial) },
    { label: "Facturado ciclo anterior", value: formatUsd(row.facturado) },
    { label: "Oportunidad", value: formatUsd(row.oportunidad), tone: "amber" },
    { label: "% capturado", value: formatPct(row.captura) },
  ];

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Volver a clientes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-[15px] font-bold text-primary-dark">
            {inicial}
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-ink">{productor.razonSocial}</h2>
            <p className="text-[13px] text-ink-soft">{meta || "—"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setHistOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Clock size={16} /> Historial
          </button>
          <button
            onClick={() => setActOpen(true)}
            className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={16} /> Cargar actividad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-[12px] text-ink-muted">{k.label}</p>
            <p
              className={`mt-1 font-display text-[24px] font-bold ${
                k.tone === "amber" ? "text-amber" : "text-ink"
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-amber/10 px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber/15">
          <Target size={24} className="text-amber" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-amber">
            Objetivo de venta sugerido para esta campaña
          </p>
          <p className="font-display text-[20px] font-bold text-ink">
            {formatUsd(row.oportunidad)} a capturar
          </p>
        </div>
      </div>

      {cultivos.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-muted">Por cultivo</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cultivos.map((c) => {
              const pot = valorCultivo(c);
              const fact = facturadoCultivo(c);
              const op = oportunidadCultivo(c);
              const cap = pot > 0 ? (fact / pot) * 100 : 0;
              return (
                <div key={c.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
                      <Sprout size={16} className="text-accent" /> {c.cultivo}
                    </span>
                    <span className="text-[12px] text-ink-muted">{c.superficieHa} ha</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-soft">
                    Pot. {formatUsd(pot)} · Fact. {formatUsd(fact)}
                  </p>
                  <p className="text-[12px] text-ink-soft">Oportunidad {formatUsd(op)}</p>
                  <div className="mt-2">
                    <Bar pct={cap} tone="accent" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cultivos.some((c) => c.insumos && c.insumos.length > 0) && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-muted">Detalle por producto</p>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-[13px]">
              <thead className="bg-surface text-left text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 text-right font-medium">Inv. potencial</th>
                  <th className="px-4 py-3 text-right font-medium">Facturado ant.</th>
                  <th className="px-4 py-3 text-right font-medium">Oportunidad</th>
                </tr>
              </thead>
              <tbody>
                {cultivos.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="bg-surface/60">
                      <td colSpan={4} className="px-4 py-2 text-[12px] font-semibold text-ink-soft">
                        {c.cultivo} · {c.superficieHa} ha
                      </td>
                    </tr>
                    {(c.insumos ?? []).map((ins, idx) => {
                      const pot = inversionInsumo(ins, c.superficieHa);
                      const op = pot - (ins.facturacionAnterior || 0);
                      return (
                        <tr key={idx} className="border-t border-line">
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{ins.producto}</p>
                            <p className="text-[11px] text-ink-muted">
                              {ins.unidadXHa} {ins.unidad ?? "u"}/ha × {formatUsd(ins.usdXUnidad)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right text-ink-soft">{formatUsd(pot)}</td>
                          <td className="px-4 py-3 text-right text-ink-soft">
                            {formatUsd(ins.facturacionAnterior || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber">{formatUsd(op)}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-line bg-surface/40">
                  <td className="px-4 py-3 font-semibold text-ink">Total cliente</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatUsd(row.potencial)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatUsd(row.facturado)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">
                    {formatUsd(row.oportunidad)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={histOpen} onClose={() => setHistOpen(false)} title="Historial">
        {notas.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Sin actividades registradas todavía.</p>
        ) : (
          <ol>
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
                    <span className="text-[11px] text-ink-muted">{formatFecha(n.fechaContacto)}</span>
                  </div>
                  {n.notaVisita && <p className="text-[12px] text-ink-soft">{n.notaVisita}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Drawer>

      <Drawer open={actOpen} onClose={() => setActOpen(false)} title="Cargar actividad">
        <CargarActividad
          productorId={id}
          onSaved={() => {
            setActOpen(false);
            bump((v) => v + 1);
          }}
        />
      </Drawer>
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

      <TableShell
        head={["Cliente", "Vendedor", "Ha", "Potencial", "Facturado", "Oportunidad", "% captura"]}
      >
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
            <td className="px-4 py-3 text-right text-ink-soft">{r.productor.vendedor || "—"}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.hectareas}</td>
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
  const vendedores = vendedoresResumen();
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vendedores.map((v) => {
        const ini = v.vendedor
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div key={v.vendedor} className="card card-hover space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-[12px] font-semibold text-primary-dark">
                {ini}
              </div>
              <p className="font-display text-[15px] font-semibold text-ink">{v.vendedor}</p>
            </div>
            <p className="text-[13px] text-ink-muted">
              {v.clientes} cliente{v.clientes === 1 ? "" : "s"} · {v.hectareas} ha
            </p>
            <p className="text-[13px] text-ink-soft">
              Facturado <span className="font-semibold text-ink">{formatUsd(v.facturado)}</span>
            </p>
            <p className="text-[13px] text-ink-soft">
              Oportunidad <span className="font-semibold text-amber">{formatUsd(v.oportunidad)}</span>
            </p>
            <Bar pct={v.captura * 100} tone={v.captura >= 0.7 ? "accent" : "amber"} />
            <p className="text-[12px] text-ink-muted">{formatPct(v.captura)} capturado</p>
          </div>
        );
      })}
    </div>
  );
}

function Productos() {
  const catalogo = useApp((s) => s.catalogo);
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Plus size={17} /> Nuevo producto
        </button>
      </div>
      <TableShell head={["Producto", "Categoría", "Marca", "Presentación", "Precio", "Stock"]}>
      {catalogo.map((p) => (
        <tr key={p.id} className="border-t border-line transition-colors hover:bg-surface">
          <td className="px-4 py-3">
            <p className="font-medium text-ink">{p.nombre}</p>
            <p className="text-[11px] text-ink-muted">{p.codigo || p.principioActivo || "—"}</p>
          </td>
          <td className="px-4 py-3 text-right">
            {p.categoria ? (
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                {p.categoria}
              </span>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
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
      <Drawer open={open} onClose={() => setOpen(false)} title="Nuevo producto">
        <ProductoForm onSaved={() => setOpen(false)} />
      </Drawer>
    </div>
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
          Cartera por vendedor — facturado vs oportunidad
        </h2>
        <div className="mt-3 space-y-4">
          {vendedoresResumen().map((v) => {
            const total = v.facturado + v.oportunidad;
            const facPct = total > 0 ? (v.facturado / total) * 100 : 0;
            return (
              <div key={v.vendedor}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink">{v.vendedor}</span>
                  <span className="text-ink-muted">{formatUsd(total)}</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-pill bg-line">
                  <div className="h-2.5 bg-primary" style={{ width: `${facPct}%` }} />
                  <div className="h-2.5 bg-amber" style={{ width: `${100 - facPct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> Facturado
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber" /> Oportunidad
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function Parametros() {
  const cfg = getConfig();
  const refresh = useApp((s) => s.refresh);
  const [costos, setCostos] = useState<Record<string, number>>(cfg.costosHa);
  const [objetivo, setObjetivo] = useState<number>(cfg.objetivoCampania);
  const [nombre, setNombre] = useState<string>(cfg.nombreCampania);
  const [campanias, setCamps] = useState<Campania[]>(cfg.campanias.map((c) => ({ ...c })));
  const [saved, setSaved] = useState(false);
  const patchCamp = (i: number, p: Partial<Campania>) =>
    setCamps((cs) => cs.map((c, n) => (n === i ? { ...c, ...p } : c)));
  const guardar = () => {
    setCostosHa(costos);
    setObjetivoCampania(objetivo);
    setNombreCampania(nombre);
    setCampanias(campanias.filter((c) => c.nombre.trim()));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="max-w-2xl space-y-4">
      <FormulaAgronomica onSaved={() => void refresh()} />
      <div className="card space-y-3">
        <p className="font-display text-[14px] font-semibold text-ink">Campaña</p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-ink">Nombre de campaña</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-40 rounded-xl bg-surface px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-primary/20"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-ink">Objetivo de facturación</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-muted">U$S</span>
            <input
              type="number"
              value={objetivo}
              onChange={(e) => setObjetivo(Number(e.target.value))}
              className="w-32 rounded-xl bg-surface px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-primary/20"
            />
          </div>
        </label>
        <p className="text-[12px] text-ink-muted">
          Si el objetivo queda en 0, el panel usa el potencial total de la cartera como meta.
        </p>
      </div>

      <p className="text-[13px] text-ink-muted">
        Costo por hectárea de cada cultivo. Lo fija el supervisor y se usa para calcular el valor
        potencial de cada cliente.
      </p>
      <div className="card divide-y divide-line py-1">
        {CULTIVOS.map((c) => (
          <div key={c} className="flex items-center justify-between py-2.5">
            <span className="text-[14px] text-ink">{c}</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">U$S/ha</span>
              <input
                type="number"
                value={costos[c] ?? 0}
                onChange={(e) => setCostos((s) => ({ ...s, [c]: Number(e.target.value) }))}
                className="w-28 rounded-xl bg-surface px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-primary/20"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[14px] font-semibold text-ink">Cronograma de campañas</p>
          <button
            type="button"
            onClick={() => setCamps((cs) => [...cs, { nombre: "", inicio: "", cierre: "" }])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={15} /> Agregar campaña
          </button>
        </div>
        <p className="text-[12px] text-ink-muted">
          Las fechas de cada campaña alimentan los semáforos del panel del supervisor.
        </p>
        {campanias.map((c, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <input
              value={c.nombre}
              onChange={(e) => patchCamp(i, { nombre: e.target.value })}
              placeholder="Ej.: Trigo 2026"
              className="col-span-5 rounded-lg bg-surface px-2 py-2 text-[13px] outline-none"
            />
            <input
              type="date"
              value={c.inicio}
              onChange={(e) => patchCamp(i, { inicio: e.target.value })}
              className="col-span-3 rounded-lg bg-surface px-2 py-2 text-[12px] outline-none"
            />
            <input
              type="date"
              value={c.cierre}
              onChange={(e) => patchCamp(i, { cierre: e.target.value })}
              className="col-span-3 rounded-lg bg-surface px-2 py-2 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={() => setCamps((cs) => cs.filter((_, n) => n !== i))}
              aria-label="Quitar campaña"
              className="col-span-1 flex justify-center text-ink-muted hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={guardar}
        className="press rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        {saved ? "Guardado" : "Guardar parámetros"}
      </button>
    </div>
  );
}

function ValorClienteScreen() {
  const lista = productores.list();
  const [id, setId] = useState(lista[0]?.id ?? "");
  const [rows, setRows] = useState<Cultivo[]>([]);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = productores.get(id);
    setRows(
      p
        ? p.unidades
            .flatMap((u) => u.cultivos)
            .map((c) => ({ ...c, insumos: (c.insumos ?? []).map((x) => ({ ...x })) }))
        : [],
    );
  }, [id]);

  const potencial = rows.reduce((a, c) => a + valorCultivo(c), 0);
  const facturado = rows.reduce((a, c) => a + facturadoCultivo(c), 0);
  const oportunidad = potencial - facturado;
  const captura = potencial > 0 ? facturado / potencial : 0;

  const patchCultivo = (i: number, p: Partial<Cultivo>) =>
    setRows((rs) => rs.map((c, n) => (n === i ? { ...c, ...p } : c)));
  const patchInsumo = (ci: number, ii: number, p: Partial<InsumoLinea>) =>
    setRows((rs) =>
      rs.map((c, n) =>
        n === ci
          ? { ...c, insumos: (c.insumos ?? []).map((x, m) => (m === ii ? { ...x, ...p } : x)) }
          : c,
      ),
    );
  const addInsumo = (ci: number) =>
    setRows((rs) =>
      rs.map((c, n) =>
        n === ci
          ? {
              ...c,
              insumos: [
                ...(c.insumos ?? []),
                { producto: "", unidad: "u", unidadXHa: 0, usdXUnidad: 0, facturacionAnterior: 0 },
              ],
            }
          : c,
      ),
    );
  const removeInsumo = (ci: number, ii: number) =>
    setRows((rs) =>
      rs.map((c, n) => (n === ci ? { ...c, insumos: (c.insumos ?? []).filter((_, m) => m !== ii) } : c)),
    );

  const guardar = async () => {
    const productor = productores.get(id);
    if (!productor) return;
    setSaving(true);
    await productores.save({
      ...productor,
      unidades: [{ id: productor.unidades[0]?.id ?? newId(), cultivos: rows }],
      updatedAt: Date.now(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const numField =
    "w-full rounded-lg bg-surface px-2 py-1.5 text-right text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20";
  const txtField =
    "w-full rounded-lg bg-surface px-2 py-1.5 text-[13px] outline-none focus:bg-white focus:ring-2 focus:ring-primary/20";

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        Armá la canasta de insumos por cultivo (dosis/ha, precio y lo facturado el ciclo anterior).
        El valor potencial y la oportunidad se calculan solos.
      </p>
      <div className="max-w-xs">
        <Dropdown
          value={id}
          options={lista.map((p) => ({ value: p.id, label: p.razonSocial }))}
          onChange={setId}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Target} label="Valor potencial" value={formatUsd(potencial)} tone="accent" />
        <Kpi icon={DollarSign} label="Facturado" value={formatUsd(facturado)} />
        <Kpi icon={TrendingUp} label="Oportunidad" value={formatUsd(oportunidad)} tone="amber" />
        <Kpi icon={Gauge} label="Capturado" value={formatPct(captura)} />
      </div>

      {rows.map((c, ci) => {
        const potC = valorCultivo(c);
        const factC = facturadoCultivo(c);
        return (
          <div key={c.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sprout size={16} className="text-accent" />
                <select
                  value={c.cultivo}
                  onChange={(e) => patchCultivo(ci, { cultivo: e.target.value })}
                  className="rounded-lg bg-surface px-2 py-1.5 text-[14px] font-semibold outline-none"
                >
                  {CULTIVOS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={c.superficieHa || 0}
                  onChange={(e) => patchCultivo(ci, { superficieHa: Number(e.target.value) })}
                  className="w-20 rounded-lg bg-surface px-2 py-1.5 text-right text-[13px] outline-none"
                />
                <span className="text-[12px] text-ink-muted">ha</span>
              </div>
              <button
                onClick={() => setRows((rs) => rs.filter((_, n) => n !== ci))}
                className="text-[12px] text-ink-muted hover:text-danger"
              >
                Quitar cultivo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-2 py-1 font-medium">Producto</th>
                    <th className="px-2 py-1 font-medium">Unidad</th>
                    <th className="px-2 py-1 text-right font-medium">Dosis/ha</th>
                    <th className="px-2 py-1 text-right font-medium">Precio U$S</th>
                    <th className="px-2 py-1 text-right font-medium">Fact. ant.</th>
                    <th className="px-2 py-1 text-right font-medium">Inv. pot.</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {(c.insumos ?? []).map((ins, ii) => (
                    <tr key={ii} className="border-t border-line">
                      <td className="min-w-[140px] px-2 py-1.5">
                        <input
                          value={ins.producto}
                          onChange={(e) => patchInsumo(ci, ii, { producto: e.target.value })}
                          className={txtField}
                          placeholder="Producto"
                        />
                      </td>
                      <td className="w-20 px-2 py-1.5">
                        <input
                          value={ins.unidad ?? ""}
                          onChange={(e) => patchInsumo(ci, ii, { unidad: e.target.value })}
                          className={txtField}
                          placeholder="u"
                        />
                      </td>
                      <td className="w-24 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.unidadXHa || 0}
                          onChange={(e) => patchInsumo(ci, ii, { unidadXHa: Number(e.target.value) })}
                          className={numField}
                        />
                      </td>
                      <td className="w-24 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.usdXUnidad || 0}
                          onChange={(e) => patchInsumo(ci, ii, { usdXUnidad: Number(e.target.value) })}
                          className={numField}
                        />
                      </td>
                      <td className="w-28 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.facturacionAnterior || 0}
                          onChange={(e) =>
                            patchInsumo(ci, ii, { facturacionAnterior: Number(e.target.value) })
                          }
                          className={numField}
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold text-accent">
                        {formatUsd(inversionInsumo(ins, c.superficieHa))}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => removeInsumo(ci, ii)}
                          aria-label="Quitar insumo"
                          className="text-ink-muted hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => addInsumo(ci)}
                className="flex items-center gap-1 text-[13px] font-semibold text-primary"
              >
                <Plus size={15} /> Agregar insumo
              </button>
              <span className="text-[13px] text-ink-soft">
                Potencial <span className="font-semibold text-accent">{formatUsd(potC)}</span> · Fact.{" "}
                <span className="font-semibold text-ink">{formatUsd(factC)}</span> · Oport.{" "}
                <span className="font-semibold text-amber">{formatUsd(potC - factC)}</span>
              </span>
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setRows((rs) => [
              ...rs,
              { id: newId(), cultivo: "Maíz", superficieHa: 0, facturado: 0, insumos: [] },
            ])
          }
          className="flex items-center gap-1 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Plus size={15} /> Agregar cultivo
        </button>
        <button
          onClick={guardar}
          disabled={saving || !id}
          className="press rounded-2xl bg-primary px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-disabled"
        >
          {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

const SEM_STYLE: Record<string, { dot: string; chip: string }> = {
  verde: { dot: "bg-accent", chip: "bg-accent/10 text-accent-dark" },
  amarillo: { dot: "bg-amber", chip: "bg-amber/15 text-amber" },
  rojo: { dot: "bg-danger", chip: "bg-danger/10 text-danger" },
  gris: { dot: "bg-ink-muted", chip: "bg-surface text-ink-muted" },
};

function PanelSupervisor({ onParametros }: { onParametros: () => void }) {
  const camps = getCampanias();
  const stats = supervisorStats();
  const vend = supervisorVendedores();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-muted">
          Cronograma de campañas y seguimiento de los vendedores según el paso del tiempo.
        </p>
        <button
          onClick={onParametros}
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Sliders size={16} /> Parámetros
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Calendar} label="Campañas" value={String(stats.campanias)} />
        <Kpi icon={Activity} label="En curso" value={String(stats.enCurso)} tone="accent" />
        <Kpi icon={UserCheck} label="Vendedores al día" value={String(stats.aldia)} tone="accent" />
        <Kpi icon={AlertTriangle} label="En alerta" value={String(stats.alerta)} tone="amber" />
      </div>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Cronograma de campañas</h2>
        <div className="mt-3 space-y-4">
          {camps.map((c) => {
            const e = campEstado(c);
            const bar =
              e.kind === "verde"
                ? "bg-accent"
                : e.kind === "amarillo"
                  ? "bg-amber"
                  : e.kind === "rojo"
                    ? "bg-danger"
                    : "bg-ink-muted";
            return (
              <div key={c.nombre}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{c.nombre}</span>
                  <span className="text-[12px] text-ink-muted">
                    {formatFecha(c.inicio)} — {formatFecha(c.cierre)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-surface">
                  <div className={`h-2 rounded-pill ${bar}`} style={{ width: `${e.pct}%` }} />
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium ${SEM_STYLE[e.kind].chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEM_STYLE[e.kind].dot}`} /> {e.label} ·{" "}
                    {e.pct}% del tiempo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-muted">
          Actividad de vendedores — semáforo
        </p>
        <TableShell head={["Vendedor", "Campaña", "Tiempo", "Avance", "Estado"]}>
          {vend.map((v) => (
            <tr key={v.vendedor} className="border-t border-line">
              <td className="px-4 py-3 font-medium text-ink">{v.vendedor}</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.campania}</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.tiempo}%</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.avance}%</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[12px] font-medium ${SEM_STYLE[v.kind].chip}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${SEM_STYLE[v.kind].dot}`} /> {v.label}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </div>
  );
}

export function Dashboard() {
  const user = useApp((s) => s.user)!;
  const logout = useApp((s) => s.logout);
  const [section, setSection] = useState<Section>(
    user.rol === "supervisor" ? "supervisor" : "inicio",
  );
  const allowed: Section[] =
    user.rol === "vendedor" ? RAIL_VEND : user.rol === "supervisor" ? RAIL_SUP : NAV.map((n) => n.key);
  const visibleNav = allowed
    .map((k) => NAV.find((n) => n.key === k))
    .filter(Boolean) as { key: Section; label: string; icon: typeof Users }[];
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("chaja.sidebar_collapsed") === "1",
  );
  const toggleSidebar = () =>
    setCollapsed((v) => {
      localStorage.setItem("chaja.sidebar_collapsed", v ? "0" : "1");
      return !v;
    });
  const dataVersion = useApp((s) => s.dataVersion);
  const pend = pendingTotal();

  return (
    <div className="flex h-full bg-surface">
      <aside
        className={`flex shrink-0 flex-col bg-panel text-white transition-all ${
          collapsed ? "w-16" : "w-16 md:w-60"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1">
            <img src="/chaja-mark.png" alt="" className="h-full w-full object-contain" />
          </div>
          <span
            className={`font-display text-[18px] font-bold tracking-wide ${
              collapsed ? "hidden" : "hidden md:inline"
            }`}
          >
            CHAJÁ
          </span>
          <button
            onClick={toggleSidebar}
            aria-label="Colapsar menú"
            className={`ml-auto items-center justify-center rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? "hidden" : "hidden md:flex"
            }`}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Expandir menú"
            className="mx-2 mb-1 hidden items-center justify-center rounded-xl py-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white md:flex"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        <nav className="mt-1 flex-1 space-y-1 px-2">
          {visibleNav.map((n) => {
            const active = n.key === section;
            return (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                title={n.label}
                className={`flex w-full items-center rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  active ? "bg-white/15 font-semibold text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <n.icon size={19} className="shrink-0" />
                <span className={collapsed ? "hidden" : "hidden md:inline"}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className={collapsed ? "hidden" : "hidden min-w-0 flex-1 md:block"}>
              <p className="truncate text-[13px] font-medium">{user.nombre}</p>
              <p className="text-[11px] capitalize text-white/55">{user.rol}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Salir"
              className={`text-white/65 hover:text-white ${collapsed ? "hidden" : "hidden md:inline-flex"}`}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h1 className="font-display text-[20px] font-semibold text-ink">{SECTION_TITLE[section]}</h1>
          <div className="flex items-center gap-3">
            {pend > 0 && (
              <span className="rounded-pill bg-primary-tint px-3 py-1 text-[12px] font-medium text-primary-dark">
                {pend} sin sincronizar
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-semibold text-ink">{user.nombre}</p>
                <p className="text-[11px] capitalize text-ink-muted">{user.rol}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
                {user.nombre
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main key={`${section}-${dataVersion}`} className="fade-in flex-1 overflow-y-auto p-6">
          {section === "inicio" && <Inicio />}
          {section === "clientes" && <Clientes />}
          {section === "seguimiento" && <Seguimiento />}
          {section === "operaciones" && <Operaciones />}
          {section === "referidos" && <Referidos />}
          {section === "actividad" && <CargarActividad />}
          {section === "equipo" && <Equipo />}
          {section === "productos" && <Productos />}
          {section === "valorcliente" && <ValorClienteScreen />}
          {section === "parametros" && <Parametros />}
          {section === "reportes" && <Reportes />}
          {section === "supervisor" && (
            <PanelSupervisor onParametros={() => setSection("parametros")} />
          )}
        </main>
      </div>
    </div>
  );
}
