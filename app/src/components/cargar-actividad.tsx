import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock, Mail, MessageCircle, Plus, Trash2 } from "lucide-react";
import { DateField, Dropdown, PrimaryButton, Toast } from "./ui";
import { Drawer } from "./drawer";
import { CompletarDatosCliente } from "./editar-datos-cliente";
import { notasCampo, productores } from "../lib/api";
import { newId } from "../lib/db";
import { useApp } from "../store";
import {
  CULTIVOS,
  ESTADO_PROCESO_LABEL,
  type EstadoProceso,
  type NotaCampo,
} from "../types";
import { formatUsd } from "../lib/valor-cliente";
import { getNombreCampania } from "../lib/parametros";

const GRUPOS: { grupo: string; estados: EstadoProceso[] }[] = [
  {
    grupo: "Prospección",
    estados: ["inicio_contacto", "completar_datos", "agenda_visita", "carga_valor_cliente"],
  },
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

type VisitaRow = { id: string; cultivo: string; ha: string; obs: string };

type LineaPresup = {
  id: string;
  productoId: string;
  precio: string;
  cantidad: string;
  condiciones: string;
  observaciones: string;
};

export function CargarActividad({
  onSaved,
  productorId: initialId,
  enDrawer,
  onIrValorCliente,
}: {
  onSaved?: () => void;
  productorId?: string;
  enDrawer?: boolean;
  onIrValorCliente?: () => void;
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
    { id: newId(), productoId: "", precio: "", cantidad: "1", condiciones: "", observaciones: "" },
  ]);
  const [visitaRows, setVisitaRows] = useState<VisitaRow[]>([
    { id: newId(), cultivo: "", ha: "", obs: "" },
  ]);
  const setVisitaRow = (id: string, p: Partial<VisitaRow>) =>
    setVisitaRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const [saved, setSaved] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [, bump] = useState(0);

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
    const c0 = productor.contactos?.[0];
    const f: string[] = [];
    if (!productor.email && !c0?.email) f.push("Email");
    if (!productor.celular && !productor.telefono) f.push("Móvil");
    if (!c0?.fechaNacimiento) f.push("Fecha de nacimiento");
    if (!c0?.situacionFamiliar) f.push("Estado civil");
    if (!c0?.hobbys) f.push("Hobbys");
    if (!c0?.preferenciasDeportivas) f.push("Deportes");
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
    if (actividad === "visita_campo" && visitaRows.some((r) => r.cultivo || r.ha.trim())) {
      const det = visitaRows
        .filter((r) => r.cultivo || r.ha.trim())
        .map(
          (r) =>
            `${r.cultivo || "—"}${r.ha.trim() ? ` ${r.ha} ha` : ""}${r.obs.trim() ? ` (${r.obs.trim()})` : ""}`,
        )
        .join("; ");
      partes.push(`Visita: ${det}`);
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
    // Los cultivos relevados en la visita alimentan el valor cliente: los que no
    // estaban en la ficha se agregan y los existentes actualizan su superficie.
    if (actividad === "visita_campo") {
      const relevados = visitaRows.filter((r) => r.cultivo);
      if (relevados.length) {
        const unidades = productor.unidades.length
          ? productor.unidades.map((u) => ({ ...u, cultivos: u.cultivos.map((c) => ({ ...c })) }))
          : [{ id: newId(), cultivos: [] as typeof productor.unidades[0]["cultivos"] }];
        const u0 = unidades[0];
        let cambio = false;
        for (const r of relevados) {
          const ha = num(r.ha);
          const existente = u0.cultivos.find((c) => c.cultivo === r.cultivo);
          if (!existente) {
            u0.cultivos.push({ id: newId(), cultivo: r.cultivo, superficieHa: ha, facturado: 0 });
            cambio = true;
          } else if (ha > 0 && existente.superficieHa !== ha) {
            existente.superficieHa = ha;
            cambio = true;
          }
        }
        if (cambio) {
          await productores.save({ ...productor, unidades, updatedAt: Date.now() });
        }
      }
    }
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
      if (onSaved) onSaved();
      else setHistOpen(true);
    }, 900);
  };

  const cancelar = () => {
    setActividad("inicio_contacto");
    setObservaciones("");
    setConclusiones("");
    setComentarios("");
    setMonto("");
    setLineas([
      { id: newId(), productoId: "", precio: "", cantidad: "1", condiciones: "", observaciones: "" },
    ]);
    setVisitaRows([{ id: newId(), cultivo: "", ha: "", obs: "" }]);
    onSaved?.();
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

  const notasCliente = notasCampo
    .list()
    .filter((n) => n.productorId === productorId)
    .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-muted">
          {productor?.razonSocial} · Vendedor: {productor?.vendedor || "—"} · Campaña{" "}
          {getNombreCampania()}
        </p>
        {!enDrawer && (
          <button
            type="button"
            onClick={() => setHistOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Clock size={15} /> Historial
          </button>
        )}
      </div>

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

      {actividad === "visita_campo" && (
        <div className="card space-y-3">
          {datosBox}
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-semibold text-ink">
              Detalle de la visita a campo
            </p>
            <button
              type="button"
              onClick={() =>
                setVisitaRows((rs) => [...rs, { id: newId(), cultivo: "", ha: "", obs: "" }])
              }
              className="flex items-center gap-1 text-[13px] font-semibold text-primary"
            >
              <Plus size={15} /> Agregar fila
            </button>
          </div>
          {visitaRows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5 sm:col-span-3">
                <Dropdown
                  value={r.cultivo}
                  placeholder="Cultivo"
                  options={CULTIVOS.map((c) => ({ value: c as string, label: c }))}
                  onChange={(v) => setVisitaRow(r.id, { cultivo: v })}
                />
              </div>
              <input
                value={r.ha}
                onChange={(e) => setVisitaRow(r.id, { ha: e.target.value })}
                placeholder="Ha"
                inputMode="decimal"
                className="col-span-3 sm:col-span-2 rounded-lg border border-line bg-white px-2 py-2.5 text-right text-[13px] outline-none focus:border-primary/40"
              />
              <input
                value={r.obs}
                onChange={(e) => setVisitaRow(r.id, { obs: e.target.value })}
                placeholder="Observaciones"
                className="col-span-3 sm:col-span-6 rounded-lg border border-line bg-white px-2 py-2.5 text-[13px] outline-none focus:border-primary/40"
              />
              <button
                type="button"
                onClick={() => setVisitaRows((rs) => rs.filter((x) => x.id !== r.id))}
                className="col-span-1 p-1.5 text-ink-muted active:opacity-60"
                aria-label="Quitar fila"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <label className="block space-y-1.5">
            <span className="label">Conclusiones de la visita</span>
            <textarea
              value={conclusiones}
              onChange={(e) => setConclusiones(e.target.value)}
              rows={3}
              className="field"
            />
          </label>
        </div>
      )}

      {actividad === "reunion_oficina" && (
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

      {actividad === "carga_valor_cliente" && (
        <div className="card space-y-3">
          {datosBox}
          <p className="text-[13px] text-ink-soft">
            Registrá la carga o actualización del valor cliente: hectáreas por cultivo y canasta
            de insumos. El cálculo se hace en la pantalla Valor cliente.
          </p>
          {onIrValorCliente && (
            <button
              type="button"
              onClick={onIrValorCliente}
              className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-surface"
            >
              Ir a Valor cliente <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}

      {actividad === "completar_datos" && productor && (
        <div className="card space-y-3">
          <div>
            <p className="font-display text-[14px] font-semibold text-ink">
              Completar datos de la ficha
            </p>
            <p className="text-[12px] text-ink-muted">
              Completá lo que falte para tener la ficha del cliente al día.
            </p>
          </div>
          {faltantes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-pill bg-amber/15 px-2.5 py-0.5 text-[12px] font-medium text-amber">
                {faltantes.length} dato{faltantes.length === 1 ? "" : "s"} sin completar
              </span>
              {faltantes.map((f) => (
                <span
                  key={f}
                  className="rounded-pill border border-line px-2.5 py-0.5 text-[12px] text-ink-soft"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
          <CompletarDatosCliente id={productorId} onSaved={() => bump((n) => n + 1)} />
        </div>
      )}

      {actividad === "presupuesto" && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-semibold text-ink">Presupuesto</p>
            <button
              type="button"
              onClick={() =>
                setLineas((ls) => [
                  ...ls,
                  { id: newId(), productoId: "", precio: "", cantidad: "1", condiciones: "", observaciones: "" },
                ])
              }
              className="flex items-center gap-1 rounded-2xl border border-line bg-white px-3 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-surface"
            >
              <Plus size={15} /> Agregar producto
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-2 py-1.5 font-medium">Producto</th>
                  <th className="px-2 py-1.5 text-right font-medium">Precio unit.</th>
                  <th className="px-2 py-1.5 text-right font-medium">Cant.</th>
                  <th className="px-2 py-1.5 text-right font-medium">Subtotal</th>
                  <th className="px-2 py-1.5 font-medium">Condiciones</th>
                  <th className="px-2 py-1.5 font-medium">Observaciones</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => {
                  const prod = catalogo.find((p) => p.id === l.productoId);
                  const low =
                    prod && typeof prod.stock === "number" && num(l.cantidad) > prod.stock;
                  return (
                    <tr key={l.id} className="border-t border-line align-top">
                      <td className="px-2 py-2">
                        <select
                          value={l.productoId}
                          onChange={(e) => onProducto(l.id, e.target.value)}
                          className="w-44 rounded-lg border border-line bg-white px-2 py-2 outline-none focus:border-primary/40"
                        >
                          <option value="">— Producto —</option>
                          {catalogo.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                        </select>
                        {low && <p className="mt-1 text-[11px] text-danger">stock insuficiente</p>}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={l.precio}
                          onChange={(e) => setLinea(l.id, { precio: e.target.value })}
                          placeholder="0"
                          inputMode="decimal"
                          className="w-20 rounded-lg border border-line bg-white px-2 py-2 text-right outline-none focus:border-primary/40"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={l.cantidad}
                          onChange={(e) => setLinea(l.id, { cantidad: e.target.value })}
                          placeholder="1"
                          inputMode="numeric"
                          className="w-16 rounded-lg border border-line bg-white px-2 py-2 text-right outline-none focus:border-primary/40"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-accent">
                        {formatUsd(num(l.precio) * num(l.cantidad))}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={l.condiciones}
                          onChange={(e) => setLinea(l.id, { condiciones: e.target.value })}
                          placeholder="Ej.: 30 días"
                          className="w-32 rounded-lg border border-line bg-white px-2 py-2 outline-none focus:border-primary/40"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          value={l.observaciones}
                          onChange={(e) => setLinea(l.id, { observaciones: e.target.value })}
                          placeholder="Notas"
                          className="w-36 rounded-lg border border-line bg-white px-2 py-2 outline-none focus:border-primary/40"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => setLineas((ls) => ls.filter((x) => x.id !== l.id))}
                          className="p-1 text-ink-muted active:opacity-60"
                          aria-label="Quitar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-ink-muted">
              El precio se completa solo desde la base de productos; podés modificarlo si lo necesitás.
            </p>
            <span className="shrink-0 text-[14px] font-semibold text-ink">
              Total: {formatUsd(total)}
            </span>
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
        <DateField label="Fecha" value={fecha} onChange={setFecha} />
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

      <div
        className={`flex items-center justify-end gap-2 border-t border-line ${
          enDrawer ? "sticky bottom-0 z-10 -mx-5 -mb-4 bg-white px-5 py-3" : "pt-4"
        }`}
      >
        <button
          type="button"
          onClick={cancelar}
          className="rounded-2xl border border-line bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          Cancelar
        </button>
        <div className="w-44">
          <PrimaryButton disabled={saved} onClick={guardar}>
            {saved ? "Guardada" : "Guardar actividad"}
          </PrimaryButton>
        </div>
      </div>
      <Toast show={saved} message="Actividad guardada" />

      <Drawer open={histOpen} onClose={() => setHistOpen(false)} title="Historial">
        {notasCliente.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Sin actividades registradas para este cliente.</p>
        ) : (
          <div className="space-y-3">
            {notasCliente.map((n) => (
              <div key={n.id} className="rounded-2xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                    {ESTADO_PROCESO_LABEL[n.actividad]}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    {new Date(n.fechaContacto).toLocaleDateString("es-AR")}
                  </span>
                </div>
                {n.notaVisita && <p className="mt-1.5 text-[13px] text-ink-soft">{n.notaVisita}</p>}
                <p className="mt-1 text-[11px] text-ink-muted">{n.creadoPor ?? ""}</p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
}
