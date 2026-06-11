import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
        className="-ml-1 p-1 text-ink active:opacity-60"
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
      className={`w-full rounded-2xl py-4 text-center font-display text-[16px] font-semibold text-white transition-all duration-100 ${
        disabled ? "bg-disabled" : "bg-primary active:bg-primary-dark active:scale-[0.98]"
      }`}
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

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="label">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="field">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
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
