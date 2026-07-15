import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Image as ImageIcon,
  Type,
  Trash2,
  Pencil,
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  listarAnuncios,
  guardarAnuncio,
  eliminarAnuncio,
  listarUsuarios,
  type CuentaUsuario,
} from "../lib/api";
import { newId } from "../lib/db";
import { Field, Dropdown, PrimaryButton } from "./ui";
import type { Anuncio, AnuncioAudiencia, AnuncioFormato, AnuncioTema, Rol } from "../types";

const FORMATOS: { value: AnuncioFormato; label: string; icon: typeof Type }[] = [
  { value: "imagen", label: "Solo imagen", icon: ImagePlus },
  { value: "imagen_texto", label: "Imagen + texto", icon: ImageIcon },
  { value: "texto", label: "Solo texto", icon: Type },
];

const AUDIENCIAS: { value: AnuncioAudiencia; label: string }[] = [
  { value: "todos", label: "Todos los usuarios" },
  { value: "rol", label: "Por tipo de usuario" },
  { value: "grupo", label: "Por grupo" },
  { value: "usuario", label: "Un usuario específico" },
];

const ROLES: { value: Rol; label: string }[] = [
  { value: "vendedor", label: "Vendedores" },
  { value: "supervisor", label: "Supervisores" },
  { value: "gerente", label: "Líderes de equipo" },
];

const TEMAS: { value: AnuncioTema; label: string }[] = [
  { value: "azul", label: "Azul" },
  { value: "verde", label: "Verde" },
  { value: "ambar", label: "Ámbar" },
  { value: "oscuro", label: "Oscuro" },
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

function formatoLabel(f: AnuncioFormato): string {
  return FORMATOS.find((x) => x.value === f)?.label ?? f;
}

function audienciaResumen(a: Anuncio): string {
  if (a.audiencia === "todos") return "Todos los usuarios";
  if (a.audiencia === "rol") return rolLabel(a.rol);
  if (a.audiencia === "grupo") return `Grupo: ${a.grupo}`;
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
  formato: "imagen_texto" as AnuncioFormato,
  titulo: "",
  texto: "",
  enlace: "",
  imagen: "",
  audiencia: "todos" as AnuncioAudiencia,
  rol: "vendedor" as Rol,
  grupo: "",
  usuarioId: "",
  tema: "azul" as AnuncioTema,
  activo: true,
};

export function GestionCampanias() {
  const [lista, setLista] = useState<Anuncio[]>([]);
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [vista, setVista] = useState<"lista" | "form">("lista");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...VACIO });
  const [error, setError] = useState<string | null>(null);
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

  const nueva = () => {
    setEditId(null);
    setForm({ ...VACIO });
    setError(null);
    setVista("form");
  };

  const editar = (a: Anuncio) => {
    setEditId(a.id);
    setForm({
      formato: a.formato,
      titulo: a.titulo,
      texto: a.texto ?? "",
      enlace: a.enlace ?? "",
      imagen: a.imagen ?? "",
      audiencia: a.audiencia,
      rol: a.rol ?? "vendedor",
      grupo: a.grupo ?? "",
      usuarioId: a.usuarioId ?? "",
      tema: a.tema,
      activo: a.activo,
    });
    setError(null);
    setVista("form");
  };

  const subirImagen = async (file?: File) => {
    if (!file) return;
    set("imagen", await comprimirImagen(file));
  };

  const conImagen = form.formato !== "texto";
  const conTexto = form.formato !== "imagen";
  // Los grupos salen de las cuentas ya cargadas: son una etiqueta libre.
  const grupos = Array.from(
    new Set(usuarios.map((u) => (u.grupo ?? "").trim()).filter(Boolean)),
  ).sort();

  const guardar = async () => {
    setError(null);
    if (conImagen && !form.imagen) {
      setError("Subí una imagen para esta campaña.");
      return;
    }
    if (conTexto && !form.titulo.trim()) {
      setError("Escribí un título para la campaña.");
      return;
    }
    if (form.audiencia === "grupo" && !form.grupo) {
      setError("Elegí a qué grupo va dirigida.");
      return;
    }
    if (form.audiencia === "usuario" && !form.usuarioId) {
      setError("Elegí a qué usuario va dirigida.");
      return;
    }
    setSaving(true);
    const usuario = usuarios.find((u) => u.id === form.usuarioId);
    const anuncio: Anuncio = {
      id: editId ?? newId(),
      formato: form.formato,
      titulo: conTexto ? form.titulo.trim() : "",
      texto: conTexto && form.texto.trim() ? form.texto.trim() : undefined,
      imagen: conImagen ? form.imagen : undefined,
      enlace: form.enlace.trim() || undefined,
      audiencia: form.audiencia,
      rol: form.audiencia === "rol" ? form.rol : undefined,
      grupo: form.audiencia === "grupo" ? form.grupo : undefined,
      usuarioId: form.audiencia === "usuario" ? form.usuarioId : undefined,
      usuarioNombre: form.audiencia === "usuario" ? usuario?.nombre : undefined,
      tema: form.tema,
      activo: form.activo,
      createdAt:
        editId != null ? (lista.find((x) => x.id === editId)?.createdAt ?? Date.now()) : Date.now(),
    };
    await guardarAnuncio(anuncio);
    recargar();
    setSaving(false);
    setVista("lista");
  };

  const alternarActivo = async (a: Anuncio) => {
    await guardarAnuncio({ ...a, activo: !a.activo });
    recargar();
  };

  const borrar = async (a: Anuncio) => {
    await eliminarAnuncio(a.id);
    recargar();
  };

  if (vista === "lista") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={nueva}
            className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={17} /> Nueva campaña
          </button>
        </div>

        <div className="card p-0">
          <p className="border-b border-line px-4 py-3 font-display text-[14px] font-semibold text-ink">
            Campañas creadas
          </p>
          {lista.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[14px] font-medium text-ink">Todavía no hay campañas</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Creá una para comunicar a los usuarios del sistema.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lista.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  {a.imagen ? (
                    <img src={a.imagen} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-muted">
                      <Type size={18} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {a.titulo || "Campaña con imagen"}
                      </p>
                      <span
                        className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                          a.activo ? "bg-accent/15 text-accent-dark" : "bg-surface text-ink-muted"
                        }`}
                      >
                        {a.activo ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="truncate text-[12px] text-ink-muted">
                      {formatoLabel(a.formato)} · {audienciaResumen(a)}
                    </p>
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
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <div className="space-y-4">
        <button
          onClick={() => setVista("lista")}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Volver a campañas
        </button>

        <div className="card space-y-3">
          <p className="font-display text-[14px] font-semibold text-ink">
            {editId ? "Editar campaña" : "Nueva campaña"}
          </p>

          <div className="space-y-1.5">
            <span className="label">Formato</span>
            <div className="grid grid-cols-3 gap-2">
              {FORMATOS.map((f) => {
                const active = form.formato === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => set("formato", f.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[12px] font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary-tint text-primary-dark"
                        : "border-line text-ink-soft hover:bg-surface"
                    }`}
                  >
                    <f.icon size={18} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {conImagen && (
            <div className="space-y-1.5">
              <span className="label">
                Imagen / banner
                {form.formato === "imagen" && (
                  <span className="ml-1 font-normal text-ink-muted">— recomendado 900 × 300 px</span>
                )}
              </span>
              {form.imagen ? (
                <div className="relative overflow-hidden rounded-2xl border border-line">
                  <img src={form.imagen} alt="" className="max-h-52 w-full object-cover" />
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface py-8 text-[13px] font-medium text-ink-muted transition-colors hover:border-primary/40 hover:text-primary"
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
          )}

          {conTexto && (
            <>
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
              <Dropdown label="Color" value={form.tema} options={TEMAS} onChange={(v) => set("tema", v)} />
            </>
          )}

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
            {form.audiencia === "grupo" && (
              <Dropdown
                label="Grupo"
                value={form.grupo}
                options={grupos.map((g) => ({ value: g, label: g }))}
                onChange={(v) => set("grupo", v)}
                placeholder={grupos.length ? "Elegir grupo" : "Sin grupos cargados"}
              />
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

          {error && <p className="text-[12px] font-medium text-danger">{error}</p>}

          <div className="sm:max-w-xs">
            <PrimaryButton disabled={saving} onClick={guardar}>
              {saving ? "Guardando…" : editId ? "Guardar cambios" : "Publicar campaña"}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="label">Vista previa</p>
        <Preview form={form} />
        <p className="text-[12px] text-ink-muted">
          Así lo verán los destinatarios, arriba del contenido de cada pantalla.
        </p>
      </div>
    </div>
  );
}

function Preview({ form }: { form: typeof VACIO }) {
  if (form.formato === "imagen") {
    return form.imagen ? (
      <img src={form.imagen} alt="" className="aspect-[3/1] w-full rounded-2xl object-cover" />
    ) : (
      <div className="flex aspect-[3/1] w-full items-center justify-center rounded-2xl border border-dashed border-line bg-surface text-[13px] text-ink-muted">
        Subí una imagen
      </div>
    );
  }

  const wrap = TEMA_WRAP[form.tema];
  const cuerpo = (
    <div className="min-w-0 flex-1">
      <p className="font-display text-[15px] font-semibold">{form.titulo || "Título de la campaña"}</p>
      <p className={`mt-0.5 text-[13px] leading-snug ${form.tema === "oscuro" ? "text-white/75" : "text-ink-soft"}`}>
        {form.texto || "El texto del comunicado aparece acá, sobre el contenido de la pantalla."}
      </p>
    </div>
  );

  if (form.formato === "texto") {
    return <div className={`rounded-2xl border p-4 ${wrap}`}>{cuerpo}</div>;
  }

  return (
    <div className={`flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 ${wrap}`}>
      {form.imagen ? (
        <img src={form.imagen} alt="" className="h-28 w-full rounded-xl object-cover" />
      ) : (
        <div className="flex h-24 w-full items-center justify-center rounded-xl bg-black/5 text-[12px] text-ink-muted">
          Imagen del banner
        </div>
      )}
      {cuerpo}
    </div>
  );
}
