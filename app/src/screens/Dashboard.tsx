import { LogOut, Users, Target, TrendingUp, ClipboardList } from "lucide-react";
import { useApp } from "../store";
import { pendingTotal } from "../lib/api";
import { carteraKpis, embudo, rankingProductores, resumenCartera } from "../lib/analytics";
import { formatUsd } from "../lib/valor-cliente";
import { DEMO_VENDEDORES } from "../lib/demo-data";

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "ink",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "ink" | "accent" | "primary";
}) {
  const color = tone === "accent" ? "text-accent" : tone === "primary" ? "text-primary" : "text-ink";
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon size={16} />
        <span className="text-[12px]">{label}</span>
      </div>
      <p className={`mt-2 font-display text-[22px] font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Bar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "accent" }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-pill bg-line">
      <div
        className={`h-2.5 rounded-pill ${tone === "accent" ? "bg-accent" : "bg-primary"}`}
        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
      />
    </div>
  );
}

export function Dashboard() {
  const user = useApp((s) => s.user)!;
  const logout = useApp((s) => s.logout);

  const k = carteraKpis();
  const ranking = rankingProductores();
  const funnel = embudo();
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const analisis = resumenCartera();
  const pend = pendingTotal();

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <header className="sticky top-0 z-10 bg-panel px-6 py-4 text-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between">
          <div>
            <p className="font-display text-[18px] font-bold leading-tight">Chaja</p>
            <p className="text-[12px] text-white/70">Tablero de gerencia</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-white/80">{user.nombre}</span>
            <button onClick={logout} aria-label="Salir" className="text-white/80 active:opacity-60">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] space-y-6 p-6">
        {pend > 0 && (
          <p className="rounded-xl bg-primary-tint px-4 py-2 text-[13px] text-primary-dark">
            {pend} registro{pend === 1 ? "" : "s"} pendiente{pend === 1 ? "" : "s"} de sincronizar
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={Users} label="Productores" value={String(k.productores)} tone="primary" />
          <Kpi icon={Target} label="Potencial de cartera" value={formatUsd(k.potencial)} />
          <Kpi icon={TrendingUp} label="Oportunidad" value={formatUsd(k.oportunidad)} tone="accent" />
          <Kpi icon={ClipboardList} label="Actividades" value={String(k.notas)} tone="primary" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="font-display text-[16px] font-semibold text-ink">
              Productores por potencial
            </h2>
            <table className="mt-3 w-full text-[13px]">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Productor</th>
                  <th className="pb-2 text-right font-medium">Valor cliente</th>
                  <th className="pb-2 text-right font-medium">Oportunidad</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.productor.id} className="border-t border-line">
                    <td className="py-2">
                      <p className="font-medium text-ink">{r.productor.razonSocial}</p>
                      <p className="text-[11px] text-ink-muted">{r.productor.localidad || "—"}</p>
                    </td>
                    <td className="py-2 text-right font-semibold text-accent">{formatUsd(r.valor)}</td>
                    <td className="py-2 text-right text-ink-soft">{formatUsd(r.oportunidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2 className="font-display text-[16px] font-semibold text-ink">
              Embudo del proceso comercial
            </h2>
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

          <section className="card">
            <h2 className="font-display text-[16px] font-semibold text-ink">
              Comparativo de vendedores
            </h2>
            <div className="mt-3 space-y-4">
              {DEMO_VENDEDORES.map((v) => {
                const pct = Math.round((v.logrado / v.objetivo) * 100);
                return (
                  <div key={v.nombre}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="font-medium text-ink">{v.nombre}</span>
                      <span className="text-ink-muted">
                        {pct}% · {v.referidos} referidos
                      </span>
                    </div>
                    <Bar pct={pct} tone={pct >= 80 ? "accent" : "primary"} />
                    <p className="mt-1 text-[11px] text-ink-muted">
                      {formatUsd(v.logrado)} de {formatUsd(v.objetivo)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h2 className="font-display text-[16px] font-semibold text-ink">Análisis de la cartera</h2>
            <ul className="mt-3 space-y-2">
              {analisis.map((line, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-ink-muted">
              Análisis automático sobre los datos cargados.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
