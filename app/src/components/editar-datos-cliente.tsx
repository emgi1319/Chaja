import { useState } from "react";
import { DateField, Field, PrimaryButton } from "./ui";
import { productores } from "../lib/api";
import type { Contacto } from "../types";

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
      <div className="sticky bottom-0 -mx-5 -mb-4 border-t border-line bg-white px-5 py-3">
        <PrimaryButton disabled={saving} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar datos"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// Datos personales/de relación del cliente, igual que el panel "Completar datos"
// del demo (cumpleaños, estado civil, hobbys, deportes) — se guardan en el contacto.
export function CompletarDatosCliente({ id, onSaved }: { id: string; onSaved: () => void }) {
  const p = productores.get(id);
  const c0 = p?.contactos?.[0];
  const [email, setEmail] = useState(p?.email ?? c0?.email ?? "");
  const [movil, setMovil] = useState(p?.celular ?? p?.telefono ?? "");
  const [nacimiento, setNacimiento] = useState(c0?.fechaNacimiento ?? "");
  const [estadoCivil, setEstadoCivil] = useState(c0?.situacionFamiliar ?? "");
  const [hobbys, setHobbys] = useState(c0?.hobbys ?? "");
  const [deportes, setDeportes] = useState(c0?.preferenciasDeportivas ?? "");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!p) return;
    setSaving(true);
    const base: Contacto = p.contactos?.[0] ?? { nombre: p.razonSocial };
    const contacto: Contacto = {
      ...base,
      email: email.trim() || base.email,
      fechaNacimiento: nacimiento || undefined,
      situacionFamiliar: estadoCivil.trim() || undefined,
      hobbys: hobbys.trim() || undefined,
      preferenciasDeportivas: deportes.trim() || undefined,
    };
    await productores.save({
      ...p,
      email: email.trim() || p.email,
      celular: movil.trim() || p.celular,
      contactos: [contacto, ...(p.contactos?.slice(1) ?? [])],
      updatedAt: Date.now(),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Email" value={email} onChange={setEmail} type="email" inputMode="email" />
      <Field label="Móvil" value={movil} onChange={setMovil} inputMode="tel" />
      <DateField label="Fecha de nacimiento" value={nacimiento} onChange={setNacimiento} />
      <Field label="Estado civil" value={estadoCivil} onChange={setEstadoCivil} />
      <Field label="Hobbys" value={hobbys} onChange={setHobbys} />
      <Field label="Deportes" value={deportes} onChange={setDeportes} />
      <div className="sm:col-span-2">
        <PrimaryButton disabled={saving} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar datos"}
        </PrimaryButton>
      </div>
    </div>
  );
}
