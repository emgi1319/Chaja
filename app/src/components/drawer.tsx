import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <div className="drawer-overlay absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        className="sheet-panel relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-float sm:h-full sm:max-h-none sm:max-w-[460px] sm:rounded-none"
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 sm:py-4">
          <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-ink-muted transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>
        <div
          className="no-scrollbar flex-1 overflow-y-auto px-5 py-4"
          style={footer ? undefined : { paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </div>
        {footer && (
          <div
            className="border-t border-line px-5 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
