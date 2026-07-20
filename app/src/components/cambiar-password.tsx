import { useState } from "react";
import { cambiarPassword } from "../lib/api";
import { Field, PrimaryButton } from "./ui";

export function CambiarPassword({ onListo }: { onListo: () => void }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    setError(null);
    if (nueva.length < 4) {
      setError("La contraseña nueva debe tener al menos 4 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await cambiarPassword(actual, nueva);
      setOk(true);
      setActual("");
      setNueva("");
      setRepetir("");
      setTimeout(onListo, 1200);
    } catch (e) {
      setError(
        String(e).includes("403")
          ? "La contraseña actual no es correcta."
          : "No se pudo cambiar la contraseña. Revisá tu conexión.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-soft">
        Cambiá la contraseña con la que ingresás a Chajá.
      </p>
      <Field label="Contraseña actual" value={actual} onChange={setActual} type="password" />
      <Field label="Contraseña nueva" value={nueva} onChange={setNueva} type="password" />
      <Field label="Repetir contraseña nueva" value={repetir} onChange={setRepetir} type="password" />
      {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
      {ok && <p className="text-[12px] font-medium text-accent-dark">Contraseña actualizada.</p>}
      <div className="sticky bottom-0 -mx-5 -mb-4 border-t border-line bg-white px-5 py-3">
        <PrimaryButton disabled={saving || !actual || !nueva} onClick={guardar}>
          {saving ? "Guardando…" : "Cambiar contraseña"}
        </PrimaryButton>
      </div>
    </div>
  );
}
