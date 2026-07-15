import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Trash2, Shield, Upload, Download } from "lucide-react";
import { listarUsuarios, crearUsuario, eliminarUsuario, type CuentaUsuario } from "../lib/api";
import { importarCuentasExcel } from "../lib/import-excel";
import { exportarExcel } from "../lib/export";
import { Field, Dropdown, PrimaryButton } from "./ui";
import { useApp } from "../store";
import { rolLabel } from "../types";

const ROLES = [
  { value: "vendedor", label: "Vendedor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gerente", label: "Líder de equipo" },
  { value: "superadmin", label: "Super admin" },
];

const SIN_LIDER = "";

export function GestionUsuarios() {
  const yo = useApp((s) => s.user);
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [grupo, setGrupo] = useState("");
  const [liderId, setLiderId] = useState(SIN_LIDER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [reporte, setReporte] = useState<{ creadas: number; errores: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const recargar = () => {
    void listarUsuarios().then(setUsuarios);
  };

  const importar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportando(true);
    setReporte(null);
    try {
      const res = await importarCuentasExcel(file);
      setReporte(res);
      recargar();
    } catch {
      setReporte({ creadas: 0, errores: ["No se pudo leer el archivo. ¿Es un Excel o CSV válido?"] });
    } finally {
      setImportando(false);
    }
  };

  const plantilla = () =>
    void exportarExcel("plantilla-cuentas", [
      { Nombre: "Juan Pérez", Usuario: "jperez", "Contraseña": "chaja2026", Rol: "vendedor", Grupo: "Agro Norte" },
      { Nombre: "Ana Gómez", Usuario: "agomez", "Contraseña": "chaja2026", Rol: "supervisor", Grupo: "Agro Norte" },
    ]);

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

  return (
    <div className="max-w-3xl space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-[14px] font-semibold text-ink">Importar cuentas</p>
            <p className="text-[12px] text-ink-muted">
              Subí un Excel o CSV con Nombre, Usuario, Contraseña y Rol para dar de alta varias de una vez.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={plantilla}
              className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-3 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              <Download size={15} /> Plantilla
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importando}
              className="press flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-[13px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark disabled:bg-disabled"
            >
              <Upload size={15} /> {importando ? "Importando…" : "Importar"}
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => void importar(e)}
        />
        {reporte && (
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-[13px] font-medium text-ink">
              {reporte.creadas > 0
                ? `${reporte.creadas} ${reporte.creadas === 1 ? "cuenta creada" : "cuentas creadas"}.`
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

      <div className="card space-y-3">
        <p className="font-display text-[14px] font-semibold text-ink">Nueva cuenta</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre" value={nombre} onChange={setNombre} />
          <Field label="Usuario (para ingresar)" value={usuario} onChange={setUsuario} />
          <Field label="Contraseña" value={password} onChange={setPassword} />
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-[13px] text-ink-muted">
                    Sin cuentas cargadas todavía.
                  </td>
                </tr>
              )}
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-line">
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
                  <td className="px-4 py-3 text-right">
                    {u.id !== yo?.id && (
                      <button
                        onClick={() => void borrar(u)}
                        aria-label="Eliminar cuenta"
                        className="text-ink-muted transition-colors hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
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
