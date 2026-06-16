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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="drawer-overlay absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="drawer-panel relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-ink-muted transition-colors hover:bg-surface"
          >
            <X size={20} />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
