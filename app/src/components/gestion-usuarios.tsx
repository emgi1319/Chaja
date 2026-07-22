import { useEffect, useRef, useState } from "react";
import { Trash2, Shield, Users, Download, Wand2, Power, ArrowLeft, UploadCloud } from "lucide-react";
import {
  listarUsuarios,
  crearUsuario,
  eliminarUsuario,
  cambiarEstadoUsuario,
  type CuentaUsuario,
} from "../lib/api";
import { importarCuentasExcel } from "../lib/import-excel";
import { descargarCsv } from "../lib/export";
import { Field, Dropdown, PrimaryButton } from "./ui";
import { useApp } from "../store";
import { rolLabel, type Rol } from "../types";

const ROLES = [
  { value: "vendedor", label: "Vendedor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gerente", label: "Líder de equipo" },
  { value: "superadmin", label: "Super admin" },
];

// Roles que se pueden dar de alta masivamente (no tiene sentido crear super admins en lote).
const ROLES_MASIVA = ROLES.filter((r) => r.value !== "superadmin");

const SIN_LIDER = "";

// Contraseña legible para entregar en una demo (sin caracteres que se confundan).
function generarPassword(): string {
  const letras = "abcdefghijkmnpqrstuvwxyz";
  const numeros = "23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 3; i++) out += numeros[Math.floor(Math.random() * numeros.length)];
  return out;
}

function esActivo(u: CuentaUsuario): boolean {
  return u.activo === undefined || u.activo === 1 || u.activo === true;
}

export function GestionUsuarios() {
  const yo = useApp((s) => s.user);
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [grupo, setGrupo] = useState("");
  const [liderId, setLiderId] = useState(SIN_LIDER);
  const [creada, setCreada] = useState<{ usuario: string; password: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<"lista" | "masiva">("lista");

  const recargar = () => {
    void listarUsuarios().then(setUsuarios);
  };

  const lideres = usuarios.filter((u) => u.rol === "gerente");
  const puedeTenerLider = rol === "vendedor" || rol === "supervisor";
  const nombreLider = (id?: string | null) => usuarios.find((u) => u.id === id)?.nombre;
  useEffect(() => {
    recargar();
  }, []);

  const crear = async () => {
    setError(null);
    if (!nombre.trim() || !usuario.trim() || !password.trim()) {
      setError("Completá nombre, usuario y contraseña.");
      return;
    }
    setSaving(true);
    try {
      setCreada({ usuario: usuario.trim(), password });
      await crearUsuario({
        nombre: nombre.trim(),
        usuario: usuario.trim(),
        password,
        rol,
        grupo: grupo.trim() || undefined,
        // Solo vendedores y supervisores responden a un líder de equipo.
        liderId: puedeTenerLider ? liderId || undefined : undefined,
      });
      setNombre("");
      setUsuario("");
      setPassword("");
      setRol("vendedor");
      setGrupo("");
      setLiderId(SIN_LIDER);
      recargar();
    } catch {
      setCreada(null);
      setError("No se pudo crear la cuenta. ¿El usuario ya existe?");
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (u: CuentaUsuario) => {
    if (u.id === yo?.id) return;
    await eliminarUsuario(u.id);
    recargar();
  };

  const alternarEstado = async (u: CuentaUsuario) => {
    if (u.id === yo?.id) return;
    await cambiarEstadoUsuario(u.id, !esActivo(u));
    recargar();
  };

  if (vista === "masiva") {
    return (
      <CargaMasiva
        onVolver={() => {
          setVista("lista");
          recargar();
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setVista("masiva")}
          className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Users size={17} /> Carga masiva de usuarios
        </button>
      </div>

      <div className="card space-y-3">
        <p className="font-display text-[14px] font-semibold text-ink">Nueva cuenta</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre" value={nombre} onChange={setNombre} />
          <Field label="Usuario (para ingresar)" value={usuario} onChange={setUsuario} />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="label">Contraseña</span>
              <button
                type="button"
                onClick={() => setPassword(generarPassword())}
                className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
              >
                <Wand2 size={13} /> Generar
              </button>
            </div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </div>
          <Dropdown label="Rol" value={rol} options={ROLES} onChange={setRol} />
          <Field
            label="Grupo"
            value={grupo}
            onChange={setGrupo}
            placeholder="Ej: Agro Norte"
          />
          {puedeTenerLider && (
            <Dropdown
              label="Líder de equipo"
              value={liderId}
              options={[
                { value: SIN_LIDER, label: "Sin líder asignado" },
                ...lideres.map((l) => ({ value: l.id, label: l.nombre })),
              ]}
              onChange={setLiderId}
            />
          )}
        </div>
        <p className="text-[12px] text-ink-muted">
          El grupo es una etiqueta para segmentar campañas. El líder de equipo ve y puede corregir
          el trabajo de los usuarios que tenga asignados.
        </p>
        {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
        {creada && (
          <div className="rounded-2xl bg-accent/10 p-3">
            <p className="text-[13px] font-medium text-ink">Cuenta creada. Datos para entregar:</p>
            <p className="mt-0.5 font-mono text-[13px] text-ink">
              usuario: <strong>{creada.usuario}</strong> · contraseña: <strong>{creada.password}</strong>
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              El usuario puede cambiarla desde "Mi cuenta" al ingresar.
            </p>
          </div>
        )}
        <div className="sm:max-w-xs">
          <PrimaryButton disabled={saving} onClick={crear}>
            {saving ? "Creando…" : "Crear cuenta"}
          </PrimaryButton>
        </div>
      </div>

      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-[13px]">
            <thead className="bg-surface text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 font-medium">Líder</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-[13px] text-ink-muted">
                    Sin cuentas cargadas todavía.
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} className={`border-t border-line ${esActivo(u) ? "" : "opacity-55"}`}>
                  <td className="px-4 py-3 font-medium text-ink">{u.nombre}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.usuario}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-pill bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary-dark">
                      {u.rol === "superadmin" && <Shield size={12} />}
                      {rolLabel(u.rol)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{u.grupo || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{nombreLider(u.lider_id) || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${
                        esActivo(u) ? "bg-accent/15 text-accent-dark" : "bg-surface text-ink-muted"
                      }`}
                    >
                      {esActivo(u) ? "Activa" : "Desactivada"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== yo?.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => void alternarEstado(u)}
                          title={esActivo(u) ? "Desactivar cuenta" : "Activar cuenta"}
                          aria-label={esActivo(u) ? "Desactivar cuenta" : "Activar cuenta"}
                          className={`p-1.5 transition-colors ${
                            esActivo(u) ? "text-ink-muted hover:text-amber" : "text-accent hover:text-accent-dark"
                          }`}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => void borrar(u)}
                          aria-label="Eliminar cuenta"
                          className="p-1.5 text-ink-muted transition-colors hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CargaMasiva({ onVolver }: { onVolver: () => void }) {
  const [rol, setRol] = useState<Rol>("vendedor");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [importando, setImportando] = useState(false);
  const [reporte, setReporte] = useState<{ creadas: number; errores: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ejemplo = () =>
    descargarCsv("ejemplo-usuarios-chaja", [
      { Nombre: "Juan", Apellido: "Pérez", Usuario: "jperez", "Contraseña": "juan2026", Grupo: "Agro Norte" },
      { Nombre: "Ana", Apellido: "Gómez", Usuario: "agomez", "Contraseña": "ana2026", Grupo: "Agro Norte" },
    ]);

  const tomar = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    setReporte(null);
  };

  const confirmar = async () => {
    if (!file) return;
    setImportando(true);
    setReporte(null);
    try {
      const res = await importarCuentasExcel(file, { rolFijo: rol });
      setReporte(res);
    } catch {
      setReporte({ creadas: 0, errores: ["No se pudo leer el archivo. ¿Es un CSV o Excel válido?"] });
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <button
        onClick={onVolver}
        className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Volver a cuentas
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[16px] font-semibold text-ink">Carga masiva de usuarios</h2>
          <p className="text-[13px] text-ink-soft">
            Subí un CSV o Excel con Nombre, Apellido, Usuario y Contraseña. Todos se crean con el rol
            que elijas.
          </p>
        </div>
        <button
          onClick={ejemplo}
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Download size={15} /> Descargar archivo de ejemplo
        </button>
      </div>

      <div className="card space-y-4">
        <div className="sm:max-w-xs">
          <Dropdown
            label="Rol de los usuarios a cargar"
            value={rol}
            options={ROLES_MASIVA as { value: Rol; label: string }[]}
            onChange={setRol}
          />
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            tomar(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
            drag ? "border-primary bg-primary-tint" : "border-line bg-surface hover:border-primary/40"
          }`}
        >
          <UploadCloud size={28} className={drag ? "text-primary" : "text-ink-muted"} />
          {file ? (
            <p className="text-[14px] font-medium text-ink">{file.name}</p>
          ) : (
            <>
              <p className="text-[14px] font-medium text-ink">
                Arrastrá el archivo acá o hacé clic para elegirlo
              </p>
              <p className="text-[12px] text-ink-muted">Formatos: .csv, .xlsx</p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            tomar(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="sm:max-w-xs">
          <PrimaryButton disabled={!file || importando} onClick={confirmar}>
            {importando ? "Creando cuentas…" : "Confirmar"}
          </PrimaryButton>
        </div>

        {reporte && (
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-[13px] font-medium text-ink">
              {reporte.creadas > 0
                ? `${reporte.creadas} ${reporte.creadas === 1 ? "cuenta creada" : "cuentas creadas"} con rol ${rolLabel(rol)}.`
                : "No se creó ninguna cuenta."}
            </p>
            {reporte.errores.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {reporte.errores.map((x, i) => (
                  <li key={i} className="text-[12px] text-danger">
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
