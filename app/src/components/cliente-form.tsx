import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Field, PrimaryButton, Dropdown } from "./ui";
import { productores } from "../lib/api";
import { newId } from "../lib/db";
import { CULTIVOS, type Cultivo, type Productor } from "../types";
import { formatUsd, valorCultivo } from "../lib/valor-cliente";
import { useApp } from "../store";
import { DEMO_VENDEDORES } from "../lib/demo-data";
import { getNombreCampania } from "../lib/parametros";
import { getPosicion } from "../lib/native/geo";

type CultivoDraft = { id: string; cultivo: string; superficieHa: string };

function num(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

const emptyCultivo = (): CultivoDraft => ({ id: newId(), cultivo: "Maíz", superficieHa: "" });

function toCultivo(d: CultivoDraft): Cultivo {
  return { id: d.id, cultivo: d.cultivo, superficieHa: num(d.superficieHa), facturado: 0 };
}

export function ClienteForm({ onSaved }: { onSaved: () => void }) {
  const user = useApp((s) => s.user);
  const [razonSocial, setRazonSocial] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [vendedor, setVendedor] = useState(DEMO_VENDEDORES[0]?.nombre ?? "");
  const [campania, setCampania] = useState(getNombreCampania());
  const [cultivos, setCultivos] = useState<CultivoDraft[]>([emptyCultivo()]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const valorTotal = cultivos.reduce((acc, c) => acc + valorCultivo(toCultivo(c)), 0);
  const patch = (id: string, p: Partial<CultivoDraft>) =>
    setCultivos((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const guardar = async () => {
    if (!razonSocial.trim()) return;
    setSaving(true);
    const prod: Productor = {
      id: newId(),
      razonSocial: razonSocial.trim(),
      vendedor,
      campania,
      localidad,
      telefono,
      email,
      contactos: [],
      unidades: [
        { id: newId(), lat: coords?.lat, lng: coords?.lng, cultivos: cultivos.map(toCultivo) },
      ],
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    };
    await productores.save(prod);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Field label="Nombre del establecimiento" value={razonSocial} onChange={setRazonSocial} />
        <Field label="Localidad" value={localidad} onChange={setLocalidad} />
        <Field label="Teléfono" value={telefono} onChange={setTelefono} inputMode="tel" />
        <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
        <Dropdown
          label="Vendedor asignado"
          value={vendedor}
          options={DEMO_VENDEDORES.map((v) => ({ value: v.nombre, label: v.nombre }))}
          onChange={setVendedor}
        />
        <Dropdown
          label="Campaña"
          value={campania}
          options={Array.from(new Set([getNombreCampania(), "2025/26", "2024/25"])).map((c) => ({
            value: c,
            label: c,
          }))}
          onChange={setCampania}
        />
        <button
          type="button"
          onClick={async () => {
            setGeoLoading(true);
            setCoords(await getPosicion());
            setGeoLoading(false);
          }}
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <MapPin size={15} className="text-primary" />
          {coords
            ? `Ubicación: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
            : geoLoading
              ? "Obteniendo ubicación…"
              : "Usar mi ubicación (georreferenciar)"}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[15px] font-semibold text-ink">Cultivos del establecimiento</p>
          <button
            onClick={() => setCultivos((cs) => [...cs, emptyCultivo()])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        {cultivos.map((c) => (
          <div key={c.id} className="space-y-3 rounded-2xl border border-line p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-3">
                <Dropdown
                  label="Cultivo"
                  value={c.cultivo}
                  options={CULTIVOS.map((x) => ({ value: x as string, label: x }))}
                  onChange={(v) => patch(c.id, { cultivo: v })}
                />
                <Field
                  label="Hectáreas"
                  value={c.superficieHa}
                  onChange={(v) => patch(c.id, { superficieHa: v })}
                  inputMode="decimal"
                />
              </div>
              {cultivos.length > 1 && (
                <button
                  onClick={() => setCultivos((cs) => cs.filter((x) => x.id !== c.id))}
                  aria-label="Quitar cultivo"
                  className="mt-7 p-2 text-ink-muted active:opacity-60"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <p className="text-right text-[13px] text-ink-muted">
              Valor potencial:{" "}
              <span className="font-semibold text-accent">{formatUsd(valorCultivo(toCultivo(c)))}</span>
            </p>
          </div>
        ))}
        <p className="text-[12px] text-ink-muted">
          El costo por hectárea sale de Parámetros; el facturado se carga en la ficha de Valor
          Cliente.
        </p>
      </div>

      <div className="sticky bottom-0 -mx-5 -mb-4 space-y-2 border-t border-line bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] text-ink-muted">Valor cliente</span>
          <span className="font-display text-[18px] font-bold text-accent">
            {formatUsd(valorTotal)}
          </span>
        </div>
        <PrimaryButton disabled={saving || !razonSocial.trim()} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar cliente"}
        </PrimaryButton>
      </div>
    </div>
  );
}
