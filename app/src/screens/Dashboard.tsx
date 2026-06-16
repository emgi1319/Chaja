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
} from "lucide-react";
import { useApp } from "../store";
import { pendingTotal } from "../lib/api";
import {
  carteraKpis,
  embudo,
  productoresRows,
  capturaPorCultivo,
  resumenCartera,
  formatPct,
} from "../lib/analytics";
import { formatUsd } from "../lib/valor-cliente";
import { DEMO_VENDEDORES } from "../lib/demo-data";

type Section = "inicio" | "clientes" | "equipo" | "productos" | "reportes";

const NAV: { key: Section; label: string; icon: typeof Users }[] = [
  { key: "inicio", label: "Inicio", icon: LayoutDashboard },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "equipo", label: "Equipo", icon: UserCheck },
  { key: "productos", label: "Productos", icon: Package },
  { key: "reportes", label: "Reportes", icon: BarChart3 },
];

const SECTION_TITLE: Record<Section, string> = {
  inicio: "Resumen general",
  clientes: "Clientes",
  equipo: "Equipo de ventas",
  productos: "Productos",
  reportes: "Reportes",
};

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

function Clientes() {
  const [q, setQ] = useState("");
  const all = productoresRows();
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter(
      (r) =>
        r.productor.razonSocial.toLowerCase().includes(t) ||
        (r.productor.localidad ?? "").toLowerCase().includes(t),
    );
  }, [q, all]);

  return (
    <div className="space-y-4">
      <div className="flex max-w-sm items-center gap-2 rounded-2xl border border-transparent bg-white px-3 shadow-card transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
        <Search size={18} className="text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente"
          className="w-full bg-transparent py-2.5 text-[14px] outline-none"
        />
      </div>

      <TableShell head={["Cliente", "Potencial", "Facturado", "Oportunidad", "% captura"]}>
        {rows.map((r) => (
          <tr key={r.productor.id} className="border-t border-line transition-colors hover:bg-surface">
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
        <main key={section} className="fade-in flex-1 overflow-y-auto p-6">
          {section === "inicio" && <Inicio />}
          {section === "clientes" && <Clientes />}
          {section === "equipo" && <Equipo />}
          {section === "productos" && <Productos />}
          {section === "reportes" && <Reportes />}
        </main>
      </div>
    </div>
  );
}
