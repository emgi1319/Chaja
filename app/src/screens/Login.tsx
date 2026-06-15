import { useState } from "react";
import { PrimaryButton } from "../components/ui";
import { login } from "../lib/api";
import { useApp } from "../store";

export function Login() {
  const setUser = useApp((s) => s.setUser);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!usuario.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(usuario.trim(), password);
      setUser(user);
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen justify-center px-7">
      <div className="fade-in-up flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-float">
          <span className="font-display text-[40px] font-bold leading-none text-white">C</span>
        </div>
        <h1 className="mt-4 font-display text-[24px] font-bold text-ink">Chaja</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Ingresá con tu usuario del sistema</p>
      </div>

      <div className="fade-in-up mt-8 space-y-3" style={{ animationDelay: "80ms" }}>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Usuario"
          autoCapitalize="none"
          autoCorrect="off"
          className="field"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          type="password"
          placeholder="Contraseña"
          className="field"
        />
        {error && <p className="px-1 text-[13px] text-danger">{error}</p>}
        <PrimaryButton disabled={loading || !usuario.trim() || !password} onClick={submit}>
          {loading ? "Ingresando…" : "Ingresar"}
        </PrimaryButton>
      </div>
    </div>
  );
}
