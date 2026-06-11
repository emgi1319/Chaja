import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { TopBar, PrimaryButton, Field } from "../components/ui";
import { productores } from "../lib/api";
import { newId } from "../lib/db";
import type { Cultivo, InsumoLinea, Productor } from "../types";
import { formatUsd, valorCultivo } from "../lib/valor-cliente";
import { useApp } from "../store";

type InsumoDraft = {
  producto: string;
  unidadXHa: string;
  usdXUnidad: string;
  facturacionAnterior: string;
};

type CultivoDraft = {
  id: string;
  cultivo: string;
  superficieHa: string;
  insumos: InsumoDraft[];
};

function num(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function emptyInsumo(): InsumoDraft {
  return { producto: "", unidadXHa: "", usdXUnidad: "", facturacionAnterior: "" };
}

function emptyCultivo(): CultivoDraft {
  return { id: newId(), cultivo: "", superficieHa: "", insumos: [emptyInsumo()] };
}

function toCultivo(d: CultivoDraft): Cultivo {
  return {
    id: d.id,
    cultivo: d.cultivo,
    superficieHa: num(d.superficieHa),
    insumos: d.insumos.map<InsumoLinea>((i) => ({
      producto: i.producto,
      unidadXHa: num(i.unidadXHa),
      usdXUnidad: num(i.usdXUnidad),
      facturacionAnterior: num(i.facturacionAnterior),
    })),
  };
}

export function ProductorNuevo() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);

  const [razonSocial, setRazonSocial] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [cultivos, setCultivos] = useState<CultivoDraft[]>([emptyCultivo()]);
  const [saving, setSaving] = useState(false);

  const valorTotal = cultivos.reduce((acc, c) => acc + valorCultivo(toCultivo(c)), 0);

  const patchCultivo = (id: string, patch: Partial<CultivoDraft>) =>
    setCultivos((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const patchInsumo = (cid: string, idx: number, patch: Partial<InsumoDraft>) =>
    setCultivos((cs) =>
      cs.map((c) =>
        c.id === cid
          ? { ...c, insumos: c.insumos.map((i, n) => (n === idx ? { ...i, ...patch } : i)) }
          : c,
      ),
    );

  const guardar = async () => {
    if (!razonSocial.trim()) return;
    setSaving(true);
    const prod: Productor = {
      id: newId(),
      razonSocial: razonSocial.trim(),
      localidad,
      telefono,
      email,
      contactos: [],
      unidades: [{ id: newId(), cultivos: cultivos.map(toCultivo) }],
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    };
    await productores.save(prod);
    navigate("/productores");
  };

  return (
    <div className="screen">
      <TopBar title="Nuevo productor" />
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        <div className="space-y-3">
          <Field label="Razón social" value={razonSocial} onChange={setRazonSocial} />
          <Field label="Localidad" value={localidad} onChange={setLocalidad} />
          <Field label="Teléfono" value={telefono} onChange={setTelefono} inputMode="tel" />
          <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-[16px] font-semibold text-ink">Cultivos</p>
            <button
              onClick={() => setCultivos((cs) => [...cs, emptyCultivo()])}
              className="flex items-center gap-1 text-[13px] font-semibold text-primary"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>

          {cultivos.map((c) => (
            <div key={c.id} className="card space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-3">
                  <Field
                    label="Cultivo"
                    value={c.cultivo}
                    onChange={(v) => patchCultivo(c.id, { cultivo: v })}
                  />
                  <Field
                    label="Superficie (ha)"
                    value={c.superficieHa}
                    onChange={(v) => patchCultivo(c.id, { superficieHa: v })}
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

              <div className="space-y-2">
                <p className="label">Insumos</p>
                {c.insumos.map((i, idx) => (
                  <div key={idx} className="rounded-xl bg-surface p-3">
                    <input
                      value={i.producto}
                      onChange={(e) => patchInsumo(c.id, idx, { producto: e.target.value })}
                      placeholder="Producto (semilla, herbicida…)"
                      className="w-full bg-transparent pb-2 text-[14px] outline-none"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={i.unidadXHa}
                        onChange={(e) => patchInsumo(c.id, idx, { unidadXHa: e.target.value })}
                        placeholder="Un/ha"
                        inputMode="decimal"
                        className="rounded-lg bg-white px-2 py-2 text-[13px] outline-none"
                      />
                      <input
                        value={i.usdXUnidad}
                        onChange={(e) => patchInsumo(c.id, idx, { usdXUnidad: e.target.value })}
                        placeholder="U$S/un"
                        inputMode="decimal"
                        className="rounded-lg bg-white px-2 py-2 text-[13px] outline-none"
                      />
                      <input
                        value={i.facturacionAnterior}
                        onChange={(e) =>
                          patchInsumo(c.id, idx, { facturacionAnterior: e.target.value })
                        }
                        placeholder="Fact. ant."
                        inputMode="decimal"
                        className="rounded-lg bg-white px-2 py-2 text-[13px] outline-none"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    patchCultivo(c.id, { insumos: [...c.insumos, emptyInsumo()] })
                  }
                  className="text-[13px] font-semibold text-primary"
                >
                  + Insumo
                </button>
              </div>

              <p className="text-right text-[13px] text-ink-muted">
                Valor cultivo:{" "}
                <span className="font-semibold text-primary">{formatUsd(valorCultivo(toCultivo(c)))}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-actions space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[14px] text-ink-muted">Valor cliente</span>
          <span className="font-display text-[18px] font-bold text-primary">
            {formatUsd(valorTotal)}
          </span>
        </div>
        <PrimaryButton disabled={saving || !razonSocial.trim()} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar productor"}
        </PrimaryButton>
      </div>
    </div>
  );
}
