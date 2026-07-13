import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Pencil, X, Eye, EyeOff } from "lucide-react";
import {
  listarAnuncios,
  guardarAnuncio,
  eliminarAnuncio,
  listarUsuarios,
  type CuentaUsuario,
} from "../lib/api";
import { newId } from "../lib/db";
import { Field, Dropdown, PrimaryButton } from "./ui";
import type { Anuncio, AnuncioAudiencia, AnuncioTema, Rol } from "../types";

const AUDIENCIAS: { value: AnuncioAudiencia; label: string }[] = [
  { value: "todos", label: "Todos los usuarios" },
  { value: "rol", label: "Por tipo de usuario" },
  { value: "usuario", label: "Un usuario específico" },
];

const ROLES: { value: Rol; label: string }[] = [
  { value: "vendedor", label: "Vendedores" },
  { value: "supervisor", label: "Supervisores" },
  { value: "gerente", label: "Gerentes" },
];

const TEMAS: { value: AnuncioTema; label: string; dot: string }[] = [
  { value: "azul", label: "Azul", dot: "bg-primary" },
  { value: "verde", label: "Verde", dot: "bg-accent" },
  { value: "ambar", label: "Ámbar", dot: "bg-amber" },
  { value: "oscuro", label: "Oscuro", dot: "bg-panel" },
];

const TEMA_WRAP: Record<AnuncioTema, string> = {
  azul: "border-primary/20 bg-primary/5 text-ink",
  verde: "border-accent/25 bg-accent/5 text-ink",
  ambar: "border-amber/30 bg-amber/10 text-ink",
  oscuro: "border-transparent bg-panel text-white",
};

function rolLabel(r?: Rol): string {
  return ROLES.find((x) => x.value === r)?.label ?? r ?? "";
}

function audienciaResumen(a: Anuncio): string {
  if (a.audiencia === "todos") return "Todos los usuarios";
  if (a.audiencia === "rol") return rolLabel(a.rol);
  return a.usuarioNombre ? `Usuario: ${a.usuarioNombre}` : "Usuario específico";
}

// Redimensiona y comprime la imagen antes de guardarla como data URL, para que
// el banner no cargue archivos de varios MB en la base ni en la sincronización.
function comprimirImagen(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1000;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const VACIO = {
  titulo: "",
  texto: "",
  enlace: "",
  imagen: "",
  audiencia: "todos" as AnuncioAudiencia,
  rol: "vendedor" as Rol,
  usuarioId: "",
  tema: "azul" as AnuncioTema,
  activo: true,
};

export function GestionCampanias() {
  const [lista, setLista] = useState<Anuncio[]>([]);
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VACIO });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const recargar = () => {
    void listarAnuncios().then(setLista);
  };
  useEffect(() => {
    recargar();
    void listarUsuarios().then(setUsuarios);
  }, []);

  const limpiar = () => {
    setEditId(null);
    setForm({ ...VACIO });
  };

  const editar = (a: Anuncio) => {
    setEditId(a.id);
    setForm({
      titulo: a.titulo,
      texto: a.texto ?? "",
      enlace: a.enlace ?? "",
      imagen: a.imagen ?? "",
      audiencia: a.audiencia,
      rol: a.rol ?? "vendedor",
      usuarioId: a.usuarioId ?? "",
      tema: a.tema,
      activo: a.activo,
    });
  };

  const subirImagen = async (file?: File) => {
    if (!file) return;
    const data = await comprimirImagen(file);
    set("imagen", data);
  };

  const guardar = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    const usuario = usuarios.find((u) => u.id === form.usuarioId);
    const anuncio: Anuncio = {
      id: editId ?? newId(),
      titulo: form.titulo.trim(),
      texto: form.texto.trim() || undefined,
      imagen: form.imagen || undefined,
      enlace: form.enlace.trim() || undefined,
      audiencia: form.audiencia,
      rol: form.audiencia === "rol" ? form.rol : undefined,
      usuarioId: form.audiencia === "usuario" ? form.usuarioId : undefined,
      usuarioNombre: form.audiencia === "usuario" ? usuario?.nombre : undefined,
      tema: form.tema,
      activo: form.activo,
      createdAt:
        editId != null ? (lista.find((x) => x.id === editId)?.createdAt ?? Date.now()) : Date.now(),
    };
    await guardarAnuncio(anuncio);
    limpiar();
    recargar();
    setSaving(false);
  };

  const alternarActivo = async (a: Anuncio) => {
    await guardarAnuncio({ ...a, activo: !a.activo });
    recargar();
  };

  const borrar = async (a: Anuncio) => {
    await eliminarAnuncio(a.id);
    if (editId === a.id) limpiar();
    recargar();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="space-y-4">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-[14px] font-semibold text-ink">
              {editId ? "Editar campaña" : "Nueva campaña"}
            </p>
            {editId && (
              <button
                onClick={limpiar}
                className="flex items-center gap-1 text-[12px] font-medium text-ink-muted hover:text-ink"
              >
                <X size={14} /> Cancelar edición
              </button>
            )}
          </div>

          <Field label="Título" value={form.titulo} onChange={(v) => set("titulo", v)} />
          <label className="block space-y-1.5">
            <span className="label">Texto</span>
            <textarea
              value={form.texto}
              onChange={(e) => set("texto", e.target.value)}
              rows={3}
              className="field"
              placeholder="Mensaje que verán los usuarios"
            />
          </label>

          <div className="space-y-1.5">
            <span className="label">Imagen / banner</span>
            {form.imagen ? (
              <div className="relative overflow-hidden rounded-2xl border border-line">
                <img src={form.imagen} alt="" className="max-h-44 w-full object-cover" />
                <button
                  onClick={() => set("imagen", "")}
                  aria-label="Quitar imagen"
                  className="absolute right-2 top-2 rounded-full bg-ink/60 p-1.5 text-white hover:bg-ink/80"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-6 text-[13px] font-medium text-ink-muted transition-colors hover:border-primary/40 hover:text-primary"
              >
                <ImagePlus size={18} /> Subir imagen
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void subirImagen(e.target.files?.[0])}
            />
          </div>

          <Field
            label="Enlace al tocar (opcional)"
            value={form.enlace}
            onChange={(v) => set("enlace", v)}
            placeholder="https://…"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Dropdown
              label="Destinatarios"
              value={form.audiencia}
              options={AUDIENCIAS}
              onChange={(v) => set("audiencia", v)}
            />
            {form.audiencia === "rol" && (
              <Dropdown label="Tipo de usuario" value={form.rol} options={ROLES} onChange={(v) => set("rol", v)} />
            )}
            {form.audiencia === "usuario" && (
              <Dropdown
                label="Usuario"
                value={form.usuarioId}
                options={usuarios.map((u) => ({ value: u.id, label: `${u.nombre} (${u.usuario})` }))}
                onChange={(v) => set("usuarioId", v)}
                placeholder="Elegir usuario"
              />
            )}
          </div>

          <Dropdown label="Color" value={form.tema} options={TEMAS} onChange={(v) => set("tema", v)} />

          <button
            onClick={() => set("activo", !form.activo)}
            className="flex items-center gap-2 text-[13px] font-medium text-ink"
          >
            <span
              className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                form.activo ? "bg-accent" : "bg-line"
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.activo ? "translate-x-4" : ""
                }`}
              />
            </span>
            {form.activo ? "Activa (se muestra a los usuarios)" : "Inactiva (guardada, no se muestra)"}
          </button>

          <div className="sm:max-w-xs">
            <PrimaryButton disabled={saving || !form.titulo.trim()} onClick={guardar}>
              {saving ? "Guardando…" : editId ? "Guardar cambios" : "Publicar campaña"}
            </PrimaryButton>
          </div>
        </div>

        <div className="card p-0">
          <p className="border-b border-line px-4 py-3 font-display text-[14px] font-semibold text-ink">
            Campañas creadas
          </p>
          {lista.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-ink-muted">Todavía no creaste ninguna campaña.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lista.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  {a.imagen && (
                    <img src={a.imagen} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-ink">{a.titulo}</p>
                      <span
                        className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                          a.activo ? "bg-accent/15 text-accent-dark" : "bg-surface text-ink-muted"
                        }`}
                      >
                        {a.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="truncate text-[12px] text-ink-muted">{audienciaResumen(a)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => void alternarActivo(a)}
                      aria-label={a.activo ? "Desactivar" : "Activar"}
                      className="p-1.5 text-ink-muted transition-colors hover:text-ink"
                    >
                      {a.activo ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => editar(a)}
                      aria-label="Editar"
                      className="p-1.5 text-ink-muted transition-colors hover:text-primary"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => void borrar(a)}
                      aria-label="Eliminar"
                      className="p-1.5 text-ink-muted transition-colors hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="label">Vista previa</p>
        <div className={`flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 ${TEMA_WRAP[form.tema]}`}>
          {form.imagen && (
            <img src={form.imagen} alt="" className="h-28 w-full rounded-xl object-cover" />
          )}
          <div>
            <p className="font-display text-[15px] font-semibold">
              {form.titulo || "Título de la campaña"}
            </p>
            <p className={`mt-0.5 text-[13px] leading-snug ${form.tema === "oscuro" ? "text-white/75" : "text-ink-soft"}`}>
              {form.texto || "El texto del comunicado aparece acá, sobre el contenido de la pantalla."}
            </p>
          </div>
        </div>
        <p className="text-[12px] text-ink-muted">
          Así lo verán los destinatarios, arriba del contenido de cada pantalla.
        </p>
      </div>
    </div>
  );
}
