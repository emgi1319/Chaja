import { TopBar, EmptyState } from "../components/ui";
import { useApp } from "../store";

export function Catalogo() {
  const catalogo = useApp((s) => s.catalogo);

  return (
    <div className="screen">
      <TopBar title="Catálogo" />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        {catalogo.length === 0 ? (
          <EmptyState
            title="Catálogo vacío"
            hint="Se carga desde el servidor o por importación de Excel/CSV."
          />
        ) : (
          <div className="space-y-2.5">
            {catalogo.map((p) => (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[15px] font-semibold text-ink">{p.nombre}</p>
                  {typeof p.stock === "number" && (
                    <span className="text-[12px] text-ink-muted">stock {p.stock}</span>
                  )}
                </div>
                <p className="text-[12px] text-ink-muted">
                  {[p.empresa, p.principioActivo, p.presentacion].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
