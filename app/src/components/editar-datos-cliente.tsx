import { useEffect, useState } from "react";
import { DateField, Dropdown, Field, PrimaryButton } from "./ui";
import { productores, listarUsuarios, type CuentaUsuario } from "../lib/api";
import { useApp } from "../store";
import type { Contacto } from "../types";

export function EditarDatosCliente({ id, onSaved }: { id: string; onSaved: () => void }) {
  const p = productores.get(id);
  const c0 = p?.contactos?.[0];
  const user = useApp((s) => s.user);
  // Solo gerencia/supervisión puede reasignar la cartera a otro vendedor; el backend
  // mueve el dueño del cliente al vendedor elegido para que lo vea.
  const esVendedor = user?.rol === "vendedor";
  const [vendedor, setVendedor] = useState(p?.vendedor ?? "");
  const [vendedores, setVendedores] = useState<CuentaUsuario[]>([]);
  useEffect(() => {
    if (esVendedor) return;
    void listarUsuarios().then((us) => setVendedores(us.filter((u) => u.rol === "vendedor")));
  }, [esVendedor]);
  const [razonSocial, setRazonSocial] = useState(p?.razonSocial ?? "");
  const [contactoNombre, setContactoNombre] = useState(c0?.nombre ?? "");
  const [email, setEmail] = useState(p?.email ?? "");
  const [telefono, setTelefono] = useState(p?.telefono ?? "");
  const [cuit, setCuit] = useState(p?.cuitRut ?? "");
  const [credito, setCredito] = useState(p?.creditoAcordado != null ? String(p.creditoAcordado) : "");
  const [scoring, setScoring] = useState(p?.scoringCrediticio ?? "");
  const [direccion, setDireccion] = useState(p?.direccion ?? "");
  const [cp, setCp] = useState(p?.cp ?? "");
  const [localidad, setLocalidad] = useState(p?.localidad ?? "");
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!p) return;
    setSaving(true);
    const credNum = parseFloat(credito.replace(",", "."));
    const nombrePersona = contactoNombre.trim();
    const contactos = nombrePersona
      ? [{ ...(c0 ?? {}), nombre: nombrePersona }, ...(p.contactos?.slice(1) ?? [])]
      : p.contactos;
    await productores.save({
      ...p,
      razonSocial: razonSocial.trim() || p.razonSocial,
      vendedor: vendedor.trim() || undefined,
      contactos,
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      cuitRut: cuit.trim() || undefined,
      creditoAcordado: isNaN(credNum) ? undefined : credNum,
      scoringCrediticio: scoring.trim() || undefined,
      direccion: direccion.trim() || undefined,
      cp: cp.trim() || undefined,
      localidad: localidad.trim() || undefined,
      updatedAt: Date.now(),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-3">
      <Field label="Establecimiento / Razón social" value={razonSocial} onChange={setRazonSocial} />
      {esVendedor ? (
        <div className="block space-y-1.5">
          <span className="label">Vendedor asignado</span>
          <p className="rounded-2xl border border-line bg-surface px-4 py-3.5 text-[15px] text-ink">
            {p?.vendedor || "—"}
          </p>
        </div>
      ) : (
        <Dropdown
          label="Vendedor asignado"
          value={vendedor}
          options={vendedores.map((v) => ({ value: v.nombre, label: v.nombre }))}
          onChange={setVendedor}
          placeholder="Elegir vendedor"
        />
      )}
      <Field label="Persona de contacto (nombre y apellido)" value={contactoNombre} onChange={setContactoNombre} />
      <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
      <Field label="Teléfono" value={telefono} onChange={setTelefono} inputMode="tel" />
      <Field label="Número fiscal (CUIT)" value={cuit} onChange={setCuit} inputMode="numeric" />
      <Field label="Crédito otorgado (U$S)" value={credito} onChange={setCredito} inputMode="decimal" />
      <Field label="Scoring crediticio" value={scoring} onChange={setScoring} />
      <Field label="Dirección" value={direccion} onChange={setDireccion} />
      <Field label="Código postal" value={cp} onChange={setCp} inputMode="numeric" />
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
