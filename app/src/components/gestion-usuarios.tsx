import { useEffect, useState } from "react";
import { Trash2, Shield } from "lucide-react";
import { listarUsuarios, crearUsuario, eliminarUsuario, type CuentaUsuario } from "../lib/api";
import { Field, Dropdown, PrimaryButton } from "./ui";
import { useApp } from "../store";

const ROLES = [
  { value: "vendedor", label: "Vendedor" },
  { value: "supervisor", label: "Supervisor" },
  { value: "gerente", label: "Gerente" },
  { value: "superadmin", label: "Super admin" },
];

function rolLabel(r: string): string {
  return ROLES.find((x) => x.value === r)?.label ?? r;
}

export function GestionUsuarios() {
  const yo = useApp((s) => s.user);
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recargar = () => {
    void listarUsuarios().then(setUsuarios);
  };
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
      await crearUsuario({ nombre: nombre.trim(), usuario: usuario.trim(), password, rol });
      setNombre("");
      setUsuario("");
      setPassword("");
      setRol("vendedor");
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
        <p className="font-display text-[14px] font-semibold text-ink">Nueva cuenta</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre" value={nombre} onChange={setNombre} />
          <Field label="Usuario (para ingresar)" value={usuario} onChange={setUsuario} />
          <Field label="Contraseña" value={password} onChange={setPassword} />
          <Dropdown label="Rol" value={rol} options={ROLES} onChange={setRol} />
        </div>
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-[13px] text-ink-muted">
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
