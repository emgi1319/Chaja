import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { TopBar, EmptyState } from "../components/ui";
import { productores } from "../lib/api";
import { valorClienteTotal, formatUsd } from "../lib/valor-cliente";

export function Productores() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const items = productores.list();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (p) =>
        p.razonSocial.toLowerCase().includes(t) ||
        (p.localidad ?? "").toLowerCase().includes(t),
    );
  }, [q, items]);

  return (
    <div className="screen">
      <TopBar
        title="Productores"
        right={
          <button
            onClick={() => navigate("/productores/nuevo")}
            aria-label="Nuevo productor"
            className="p-1 text-primary"
          >
            <Plus size={26} />
          </button>
        }
      />
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 rounded-2xl bg-surface px-3">
          <Search size={18} className="text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar"
            className="w-full bg-transparent py-3 text-[15px] outline-none"
          />
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {filtered.length === 0 ? (
          <EmptyState title="Sin productores" hint="Agregá el primero con el botón +." />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((p) => (
              <div key={p.id} className="card flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold text-ink">
                    {p.razonSocial}
                  </p>
                  <p className="text-[12px] text-ink-muted">{p.localidad || "—"}</p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-[11px] text-ink-muted">Valor cliente</p>
                  <p className="font-display text-[14px] font-semibold text-accent">
                    {formatUsd(valorClienteTotal(p))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
