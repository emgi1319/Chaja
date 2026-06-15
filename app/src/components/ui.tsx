import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown } from "lucide-react";

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 px-5 pb-2 pt-3">
      <button
        aria-label="Volver"
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="-ml-1 rounded-full p-1 text-ink transition-colors hover:bg-surface active:opacity-60"
      >
        <ArrowLeft size={24} strokeWidth={2.2} />
      </button>
      <h1 className="font-display text-[22px] font-semibold text-ink">{title}</h1>
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl py-4 text-center font-display text-[16px] font-semibold text-white transition-all duration-150 ${
        disabled
          ? "bg-disabled"
          : "bg-primary shadow-card hover:bg-primary-dark hover:shadow-float active:scale-[0.98]"
      }`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-line bg-white py-3.5 text-center font-display text-[15px] font-semibold text-ink transition-all duration-150 hover:border-primary/40 hover:bg-surface active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
}) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="label">{label}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        className="field"
      />
    </label>
  );
}

export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = "Seleccionar",
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="block space-y-1.5">
      {label && <span className="label">{label}</span>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex w-full items-center justify-between rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-ink transition-all duration-150 active:scale-[0.99] ${
            open ? "border-primary/40 bg-white ring-4 ring-primary/10" : "border-transparent"
          }`}
        >
          <span className={selected ? "" : "text-ink-muted"}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-ink-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="pop-in no-scrollbar absolute z-30 mt-2 max-h-64 w-full origin-top overflow-y-auto rounded-2xl bg-white p-1.5 shadow-float">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors ${
                    active
                      ? "bg-primary-tint font-semibold text-primary-dark"
                      : "text-ink-soft hover:bg-surface"
                  }`}
                >
                  <span>{o.label}</span>
                  {active && <Check size={16} className="text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="fade-in flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="font-display text-[16px] font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-[260px] text-[13px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Spinner({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-line border-t-primary"
      style={{ width: size, height: size }}
    />
  );
}

export function Toast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div className="fade-in-up rounded-pill bg-panel px-5 py-2.5 text-[14px] font-medium text-white shadow-float">
        {message}
      </div>
    </div>
  );
}
