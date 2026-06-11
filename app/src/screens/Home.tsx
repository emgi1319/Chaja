import { useNavigate } from "react-router-dom";
import { Users, Package, ClipboardList, LogOut } from "lucide-react";
import { useApp } from "../store";
import { pendingTotal } from "../lib/api";

const tiles = [
  { to: "/productores", icon: Users, label: "Productores" },
  { to: "/catalogo", icon: Package, label: "Catálogo" },
  { to: "/nota", icon: ClipboardList, label: "Nota de campo" },
];

export function Home() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user)!;
  const logout = useApp((s) => s.logout);
  const pend = pendingTotal();

  return (
    <div className="screen">
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="text-[13px] text-ink-muted">Hola,</p>
          <p className="font-display text-[20px] font-semibold text-ink">{user.nombre}</p>
          <p className="text-[12px] capitalize text-ink-muted">{user.rol}</p>
        </div>
        <button onClick={logout} aria-label="Salir" className="p-2 text-ink-muted active:opacity-60">
          <LogOut size={20} />
        </button>
      </div>

      {pend > 0 && (
        <p className="mx-5 mt-4 rounded-xl bg-primary-tint px-4 py-2 text-[13px] text-primary-dark">
          {pend} registro{pend === 1 ? "" : "s"} pendiente{pend === 1 ? "" : "s"} de sincronizar
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 px-5 pt-5">
        {tiles.map((t) => (
          <button
            key={t.to}
            onClick={() => navigate(t.to)}
            className="press flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-surface"
          >
            <t.icon size={34} className="text-primary" strokeWidth={1.8} />
            <span className="font-display text-[15px] font-semibold text-ink">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
