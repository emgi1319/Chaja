import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Plus, Trash2 } from "lucide-react";
import { Dropdown, PrimaryButton, Toast } from "./ui";
import { notasCampo, productores } from "../lib/api";
import { newId } from "../lib/db";
import { useApp } from "../store";
import {
  ESTADO_PROCESO_LABEL,
  type EstadoProceso,
  type NotaCampo,
} from "../types";
import { formatUsd } from "../lib/valor-cliente";
import { getNombreCampania } from "../lib/parametros";

const GRUPOS: { grupo: string; estados: EstadoProceso[] }[] = [
  { grupo: "Prospección", estados: ["inicio_contacto", "completar_datos", "agenda_visita"] },
  { grupo: "Desarrollo", estados: ["visita_campo", "reunion_oficina", "asesoria", "presupuesto"] },
  { grupo: "Cierre", estados: ["en_proceso", "negociacion", "venta", "no_venta"] },
  { grupo: "Posventa", estados: ["facturacion", "cobranza"] },
  { grupo: "Otros", estados: ["otros"] },
];

const MUEVE_PLATA: EstadoProceso[] = ["presupuesto", "venta", "facturacion", "cobranza"];

function num(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

type LineaPresup = { id: string; productoId: string; precio: string; cantidad: string };

export function CargarActividad({
  onSaved,
  productorId: initialId,
}: {
  onSaved?: () => void;
  productorId?: string;
}) {
  const catalogo = useApp((s) => s.catalogo);
  const user = useApp((s) => s.user);
  const lista = productores.list();

  const [productorId, setProductorId] = useState(initialId ?? lista[0]?.id ?? "");
  const [cultivo, setCultivo] = useState("General");
  const [actividad, setActividad] = useState<EstadoProceso>("inicio_contacto");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState("");
  const [monto, setMonto] = useState("");
  const [conclusiones, setConclusiones] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [lineas, setLineas] = useState<LineaPresup[]>([
    { id: newId(), productoId: "", precio: "", cantidad: "1" },
  ]);
  const [saved, setSaved] = useState(false);

  const productor = productores.get(productorId);
  const hectareas = productor
    ? productor.unidades.reduce((a, u) => a + u.cultivos.reduce((ac, c) => ac + (c.superficieHa || 0), 0), 0)
    : 0;
  const cultivosCliente = useMemo(() => {
    const p = productores.get(productorId);
    const cs = p ? p.unidades.flatMap((u) => u.cultivos).map((c) => c.cultivo) : [];
    return ["General", ...Array.from(new Set(cs))];
  }, [productorId]);

  useEffect(() => {
    setCultivo("General");
  }, [productorId]);

  const total = lineas.reduce((a, l) => a + num(l.precio) * num(l.cantidad), 0);

  const faltantes = useMemo(() => {
    if (!productor) return [];
    const f: string[] = [];
    if (!productor.email) f.push("Email");
    if (!productor.telefono && !productor.celular) f.push("Teléfono");
    if (!productor.localidad) f.push("Localidad");
    return f;
  }, [productor]);

  const setLinea = (id: string, p: Partial<LineaPresup>) =>
    setLineas((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  const onProducto = (id: string, productoId: string) => {
    const prod = catalogo.find((p) => p.id === productoId);
    setLinea(id, { productoId, precio: prod?.precio1 != null ? String(prod.precio1) : "" });
  };

  const buildDetalle = (): string => {
    const partes: string[] = [];
    if (actividad === "presupuesto" && lineas.some((l) => l.productoId)) {
      const items = lineas
        .filter((l) => l.productoId)
        .map((l) => {
          const p = catalogo.find((x) => x.id === l.productoId);
          return `${l.cantidad}x ${p?.nombre ?? ""}`;
        })
        .join(", ");
      partes.push(`Presupuesto (${formatUsd(total)}): ${items}`);
    }
    if (conclusiones.trim()) partes.push(`Conclusiones: ${conclusiones.trim()}`);
    if (comentarios.trim()) partes.push(`Asesoría: ${comentarios.trim()}`);
    if (MUEVE_PLATA.includes(actividad) && num(monto) > 0 && actividad !== "presupuesto") {
      partes.push(`Monto: ${formatUsd(num(monto))}`);
    }
    if (observaciones.trim()) partes.push(observaciones.trim());
    return partes.join(" · ");
  };

  const guardar = async () => {
    if (!productor) return;
    const nota: NotaCampo = {
      id: newId(),
      fechaContacto: new Date(`${fecha}T10:00:00`).toISOString(),
      productorId,
      productorNombre: productor.razonSocial,
      cultivo: cultivo === "General" ? undefined : cultivo,
      actividad,
      notaVisita: buildDetalle(),
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    };
    await notasCampo.save(nota);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved?.();
    }, 900);
  };

  const enviar = (canal: "email" | "wp") => {
    let asunto: string;
    let texto: string;
    if (actividad === "presupuesto") {
      const items = lineas
        .filter((l) => l.productoId)
        .map((l) => {
          const p = catalogo.find((x) => x.id === l.productoId);
          return `- ${l.cantidad}x ${p?.nombre ?? ""}: ${formatUsd(num(l.precio) * num(l.cantidad))}`;
        })
        .join("\n");
      asunto = `Presupuesto — ${productor?.razonSocial ?? ""}`;
      texto = `${asunto}\n\n${items}\n\nTotal: ${formatUsd(total)}`;
    } else {
      asunto = `Asesoría — ${productor?.razonSocial ?? ""}`;
      texto = `${asunto}\n${comentarios}`;
    }
    if (canal === "wp") {
      const tel = (productor?.celular ?? productor?.telefono ?? "").replace(/\D/g, "");
      const base = tel ? `https://wa.me/${tel}` : "https://wa.me/";
      window.open(`${base}?text=${encodeURIComponent(texto)}`, "_blank");
    } else {
      const to = productor?.email ?? "";
      window.open(
        `mailto:${to}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`,
        "_blank",
      );
    }
  };

  if (lista.length === 0) {
    return <p className="text-[14px] text-ink-muted">Primero cargá un cliente.</p>;
  }

  const datosBox = (
    <div className="rounded-2xl bg-surface p-4 text-[13px]">
      <p className="mb-2 font-display text-[13px] font-semibold text-ink">Datos del establecimiento</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-ink-soft sm:grid-cols-3">
        <span>Establecimiento: {productor?.razonSocial}</span>
        <span>Localidad: {productor?.localidad || "—"}</span>
        <span>Hectáreas: {hectareas}</span>
        <span>Vendedor: {productor?.vendedor || "—"}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        {productor?.razonSocial} · Vendedor: {productor?.vendedor || "—"} · Campaña{" "}
        {getNombreCampania()}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Dropdown
          label="Cliente"
          value={productorId}
          options={lista.map((p) => ({ value: p.id, label: p.razonSocial }))}
          onChange={setProductorId}
        />
        <Dropdown
          label="Cultivo"
          value={cultivo}
          options={cultivosCliente.map((c) => ({ value: c, label: c }))}
          onChange={setCultivo}
        />
      </div>

      <div className="card space-y-3">
        <p className="font-display text-[14px] font-semibold text-ink">Actividad</p>
        {GRUPOS.map((g) => (
          <div key={g.grupo}>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-muted">{g.grupo}</p>
            <div className="flex flex-wrap gap-2">
              {g.estados.map((e) => {
                const active = e === actividad;
                return (
                  <button
                    key={e}
                    onClick={() => setActividad(e)}
                    className={`rounded-pill px-3.5 py-1.5 text-[13px] transition-all active:scale-95 ${
                      active
                        ? "bg-primary font-semibold text-white"
                        : "border border-line text-ink-soft hover:border-primary/40"
                    }`}
                  >
                    {ESTADO_PROCESO_LABEL[e]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {(actividad === "visita_campo" || actividad === "reunion_oficina") && (
        <div className="card space-y-3">
          {datosBox}
          <label className="block space-y-1.5">
            <span className="label">Conclusiones de la reunión</span>
            <textarea
              value={conclusiones}
              onChange={(e) => setConclusiones(e.target.value)}
              rows={3}
              className="field"
            />
          </label>
        </div>
      )}

      {actividad === "asesoria" && (
        <div className="card space-y-3">
          {datosBox}
          <label className="block space-y-1.5">
            <span className="label">Comentarios y recomendaciones</span>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
              className="field"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => enviar("email")}
              className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <Mail size={15} /> Enviar por email
            </button>
            <button
              onClick={() => enviar("wp")}
              className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
          </div>
        </div>
      )}

      {actividad === "completar_datos" && (
        <div className="card">
          <p className="font-display text-[14px] font-semibold text-ink">Datos faltantes en la ficha</p>
          {faltantes.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-muted">La ficha está completa.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-[13px] text-ink-soft">
              {faltantes.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {actividad === "presupuesto" && (
        <div className="card space-y-3">
          <p className="font-display text-[14px] font-semibold text-ink">Presupuesto</p>
          {lineas.map((l) => {
            const prod = catalogo.find((p) => p.id === l.productoId);
            return (
              <div key={l.id} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-5">
                  <Dropdown
                    value={l.productoId}
                    placeholder="Producto"
                    options={catalogo.map((p) => ({ value: p.id, label: p.nombre }))}
                    onChange={(v) => onProducto(l.id, v)}
                  />
                </div>
                <input
                  value={l.precio}
                  onChange={(e) => setLinea(l.id, { precio: e.target.value })}
                  placeholder="Precio"
                  inputMode="decimal"
                  className="col-span-2 rounded-xl bg-surface px-2 py-2.5 text-right text-[13px] outline-none"
                />
                <input
                  value={l.cantidad}
                  onChange={(e) => setLinea(l.id, { cantidad: e.target.value })}
                  placeholder="Cant."
                  inputMode="numeric"
                  className="col-span-2 rounded-xl bg-surface px-2 py-2.5 text-right text-[13px] outline-none"
                />
                <span className="col-span-2 text-right text-[13px] font-semibold text-accent">
                  {formatUsd(num(l.precio) * num(l.cantidad))}
                </span>
                <button
                  onClick={() => setLineas((ls) => ls.filter((x) => x.id !== l.id))}
                  className="col-span-1 p-1 text-ink-muted active:opacity-60"
                  aria-label="Quitar"
                >
                  <Trash2 size={16} />
                </button>
                {prod && typeof prod.stock === "number" && num(l.cantidad) > prod.stock && (
                  <span className="col-span-12 text-[11px] text-danger">stock insuficiente</span>
                )}
              </div>
            );
          })}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                setLineas((ls) => [...ls, { id: newId(), productoId: "", precio: "", cantidad: "1" }])
              }
              className="flex items-center gap-1 text-[13px] font-semibold text-primary"
            >
              <Plus size={15} /> Agregar producto
            </button>
            <span className="text-[14px] font-semibold text-ink">Total: {formatUsd(total)}</span>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-3">
            <button
              onClick={() => enviar("email")}
              className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <Mail size={15} /> Enviar por email
            </button>
            <button
              onClick={() => enviar("wp")}
              className="flex items-center gap-1.5 rounded-2xl border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <MessageCircle size={15} /> WhatsApp
            </button>
          </div>
        </div>
      )}

      {MUEVE_PLATA.includes(actividad) && actividad !== "presupuesto" && (
        <label className="block max-w-xs space-y-1.5">
          <span className="label">Monto (U$S)</span>
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            inputMode="decimal"
            className="field"
          />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="label">Fecha</span>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="field" />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="label">Observaciones</span>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="field"
        />
      </label>

      <div className="sm:max-w-xs">
        <PrimaryButton disabled={saved} onClick={guardar}>
          {saved ? "Guardada" : "Guardar actividad"}
        </PrimaryButton>
      </div>
      <Toast show={saved} message="Actividad guardada" />
    </div>
  );
}
