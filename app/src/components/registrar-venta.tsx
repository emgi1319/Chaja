import { useState } from "react";
import { DateField, Dropdown, Field, PrimaryButton } from "./ui";
import { productores, notasCampo } from "../lib/api";
import { newId } from "../lib/db";
import { useApp } from "../store";
import { formatUsd } from "../lib/valor-cliente";

function num(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// Registra una venta cerrada: suma el monto a la facturacion del mes, con lo que
// baja la oportunidad, sube lo vendido y mejora el scoring. Queda en el historial.
export function RegistrarVenta({ id, onSaved }: { id: string; onSaved: () => void }) {
  const user = useApp((s) => s.user);
  const catalogo = useApp((s) => s.catalogo);
  const p = productores.get(id);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [cultivo, setCultivo] = useState("General");
  const [productoId, setProductoId] = useState("");
  const [monto, setMonto] = useState("");
  const [saving, setSaving] = useState(false);

  const cultivos = p
    ? ["General", ...Array.from(new Set(p.unidades.flatMap((u) => u.cultivos).map((c) => c.cultivo)))]
    : ["General"];

  const guardar = async () => {
    if (!p || num(monto) <= 0) return;
    setSaving(true);

    const periodo = fecha.slice(0, 7);
    const meses = [...(p.facturacionMensual ?? [])];
    const idx = meses.findIndex((m) => m.periodo === periodo);
    if (idx >= 0) meses[idx] = { ...meses[idx], monto: (meses[idx].monto || 0) + num(monto) };
    else meses.push({ periodo, monto: num(monto) });
    await productores.save({ ...p, facturacionMensual: meses, updatedAt: Date.now() });

    const prod = catalogo.find((x) => x.id === productoId);
    const detalle =
      `Venta${prod ? ` de ${prod.nombre}` : ""}` +
      `${cultivo !== "General" ? ` (${cultivo})` : ""}: ${formatUsd(num(monto))}`;
    await notasCampo.save({
      id: newId(),
      fechaContacto: new Date(`${fecha}T10:00:00`).toISOString(),
      productorId: id,
      productorNombre: p.razonSocial,
      cultivo: cultivo === "General" ? undefined : cultivo,
      actividad: "venta",
      notaVisita: detalle,
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">
        Registrá una venta cerrada. Se suma a lo facturado del cliente, baja la oportunidad
        disponible y actualiza el scoring.
      </p>
      <Dropdown
        label="Cultivo"
        value={cultivo}
        options={cultivos.map((c) => ({ value: c, label: c }))}
        onChange={setCultivo}
      />
      <Dropdown
        label="Producto (opcional)"
        value={productoId}
        placeholder="Sin producto"
        options={[
          { value: "", label: "— Sin producto —" },
          ...catalogo.map((x) => ({ value: x.id, label: x.nombre })),
        ]}
        onChange={setProductoId}
      />
      <Field label="Monto vendido (U$S)" value={monto} onChange={setMonto} inputMode="decimal" />
      <DateField label="Fecha de la venta" value={fecha} onChange={setFecha} />
      <div className="sticky bottom-0 -mx-5 -mb-4 border-t border-line bg-white px-5 py-3">
        <PrimaryButton disabled={saving || num(monto) <= 0} onClick={guardar}>
          {saving ? "Guardando…" : "Registrar venta"}
        </PrimaryButton>
      </div>
    </div>
  );
}
