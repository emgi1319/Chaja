import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar, PrimaryButton, Field, Select } from "../components/ui";
import { notasCampo, productores } from "../lib/api";
import { newId } from "../lib/db";
import {
  ESTADOS_PROCESO,
  ESTADO_PROCESO_LABEL,
  MEDIOS_CONTACTO,
  type EstadoProceso,
  type MedioContacto,
  type NotaCampo,
} from "../types";
import { useApp } from "../store";

export function NotaCampoNueva() {
  const navigate = useNavigate();
  const user = useApp((s) => s.user);
  const lista = productores.list();

  const [productorId, setProductorId] = useState(lista[0]?.id ?? "");
  const [cultivo, setCultivo] = useState("");
  const [medio, setMedio] = useState<MedioContacto>("Campo");
  const [actividad, setActividad] = useState<EstadoProceso>("inicio_contacto");
  const [nota, setNota] = useState("");
  const [saved, setSaved] = useState(false);

  const productorNombre = lista.find((p) => p.id === productorId)?.razonSocial ?? "";

  const build = (): NotaCampo => ({
    id: newId(),
    fechaContacto: new Date().toISOString(),
    productorId,
    productorNombre,
    cultivo,
    medio,
    actividad,
    notaVisita: nota,
    creadoPor: user?.nombre,
    updatedAt: Date.now(),
  });

  const guardar = async () => {
    await notasCampo.save(build());
    setSaved(true);
    setTimeout(() => navigate(-1), 600);
  };

  const enviarWhatsapp = () => {
    const texto = [
      "Nota de campo",
      `Productor: ${productorNombre}`,
      `Actividad: ${ESTADO_PROCESO_LABEL[actividad]}`,
      cultivo ? `Cultivo: ${cultivo}` : "",
      nota,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <div className="screen">
      <TopBar title="Nota de campo" />
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {lista.length === 0 ? (
          <p className="pt-6 text-[14px] text-ink-muted">
            Primero cargá un productor para asociar la nota.
          </p>
        ) : (
          <>
            <Select
              label="Productor"
              value={productorId}
              options={lista.map((p) => ({ value: p.id, label: p.razonSocial }))}
              onChange={setProductorId}
            />
            <Field label="Cultivo" value={cultivo} onChange={setCultivo} placeholder="Maíz, soja…" />
            <Select
              label="Medio / lugar"
              value={medio}
              options={MEDIOS_CONTACTO.map((m) => ({ value: m, label: m }))}
              onChange={setMedio}
            />
            <Select
              label="Actividad"
              value={actividad}
              options={ESTADOS_PROCESO.map((e) => ({ value: e, label: ESTADO_PROCESO_LABEL[e] }))}
              onChange={setActividad}
            />
            <label className="block space-y-1.5">
              <span className="label">Nota</span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={4}
                placeholder="Detalle de la visita"
                className="field"
              />
            </label>
          </>
        )}
      </div>

      {lista.length > 0 && (
        <div className="footer-actions space-y-2">
          <button
            onClick={enviarWhatsapp}
            className="press w-full rounded-2xl border border-line py-3 font-display text-[15px] font-semibold text-ink"
          >
            Enviar por WhatsApp
          </button>
          <PrimaryButton disabled={saved} onClick={guardar}>
            {saved ? "Guardado" : "Guardar nota"}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
