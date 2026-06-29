import { useState } from "react";
import { Field, PrimaryButton } from "./ui";
import { productores } from "../lib/api";

export function EditarDatosCliente({ id, onSaved }: { id: string; onSaved: () => void }) {
  const p = productores.get(id);
  const [email, setEmail] = useState(p?.email ?? "");
  const [telefono, setTelefono] = useState(p?.telefono ?? "");
  const [cuit, setCuit] = useState(p?.cuitRut ?? "");
  const [credito, setCredito] = useState(p?.creditoAcordado != null ? String(p.creditoAcordado) : "");
  const [scoring, setScoring] = useState(p?.scoringCrediticio ?? "");
  const [localidad, setLocalidad] = useState(p?.localidad ?? "");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!p) return;
    setSaving(true);
    const credNum = parseFloat(credito.replace(",", "."));
    await productores.save({
      ...p,
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      cuitRut: cuit.trim() || undefined,
      creditoAcordado: isNaN(credNum) ? undefined : credNum,
      scoringCrediticio: scoring.trim() || undefined,
      localidad: localidad.trim() || undefined,
      updatedAt: Date.now(),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-3">
      <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
      <Field label="Teléfono" value={telefono} onChange={setTelefono} inputMode="tel" />
      <Field label="Número fiscal (CUIT)" value={cuit} onChange={setCuit} inputMode="numeric" />
      <Field label="Crédito otorgado (U$S)" value={credito} onChange={setCredito} inputMode="decimal" />
      <Field label="Scoring crediticio" value={scoring} onChange={setScoring} />
      <Field label="Localidad" value={localidad} onChange={setLocalidad} />
      <PrimaryButton disabled={saving} onClick={guardar}>
        {saving ? "Guardando…" : "Guardar datos"}
      </PrimaryButton>
    </div>
  );
}
