import { useRef, useState, type ChangeEvent } from "react";
import { Plus, Trash2, Upload, FileText, Download, FileSpreadsheet } from "lucide-react";
import { CULTIVOS, type FormulaInsumo } from "../types";
import {
  getFormula,
  setFormula,
  costosHaDesdeFormula,
  getTiposInsumo,
  addTipoInsumo,
} from "../lib/parametros";
import { formatUsd } from "../lib/valor-cliente";
import { Drawer } from "./drawer";
import { Field, PrimaryButton } from "./ui";

const KW = {
  cultivo: ["cultivo"],
  tipo: ["tipo"],
  insumo: ["nombre", "producto", "insumo"],
  dosis: ["dosis"],
  unidad: ["unidad"],
  costoUnit: ["costo por unidad", "costo unit", "costo"],
};

function pickKey(obj: Record<string, unknown>, kws: string[]): string {
  for (const kw of kws) {
    for (const k in obj) {
      if (k.toLowerCase().includes(kw)) return String(obj[k] ?? "");
    }
  }
  return "";
}

function num(s: string): number {
  const n = parseFloat(String(s).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function mapRows(rows: Record<string, unknown>[]): FormulaInsumo[] {
  const out: FormulaInsumo[] = [];
  for (const r of rows) {
    const cultivo = pickKey(r, KW.cultivo).trim();
    if (!cultivo) continue;
    out.push({
      cultivo,
      tipo: pickKey(r, KW.tipo).trim() || undefined,
      insumo: pickKey(r, KW.insumo).trim(),
      dosis: num(pickKey(r, KW.dosis)),
      unidad: pickKey(r, KW.unidad).trim(),
      costoUnit: num(pickKey(r, KW.costoUnit)),
    });
  }
  return out;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const hd = lines[0].split(sep).map((s) => s.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep);
    const o: Record<string, string> = {};
    hd.forEach((h, k) => (o[h] = (cells[k] ?? "").trim()));
    rows.push(o);
  }
  return rows;
}

export function FormulaAgronomica({ onSaved }: { onSaved?: () => void }) {
  const [rows, setRows] = useState<FormulaInsumo[]>(() => getFormula().map((f) => ({ ...f })));
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [tipos, setTipos] = useState<string[]>(() => getTiposInsumo());
  const [tipoModal, setTipoModal] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const costos = costosHaDesdeFormula(rows);
  const cultivosEnUso = Array.from(new Set(rows.map((r) => r.cultivo).filter(Boolean)));

  const patch = (i: number, p: Partial<FormulaInsumo>) =>
    setRows((rs) => rs.map((r, n) => (n === i ? { ...r, ...p } : r)));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      let parsed: Record<string, unknown>[];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        parsed = parseCSV(await file.text());
      } else {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheet = wb.SheetNames.includes("Calculadora") ? "Calculadora" : wb.SheetNames[0];
        parsed = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" }) as Record<string, unknown>[];
      }
      const nf = mapRows(parsed);
      if (!nf.length) {
        setMsg(
          "No se encontraron filas. El archivo debe tener columnas Cultivo, Tipo, Nombre, Dosis por ha, Unidad y Costo por unidad.",
        );
        return;
      }
      setRows(nf);
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFileUrl(URL.createObjectURL(file));
      setFileName(file.name);
      setMsg(`Se importaron ${nf.length} insumos. Revisá la fórmula y guardá.`);
    } catch {
      setMsg("No se pudo leer el archivo. Probá exportarlo como CSV o cargá la fórmula a mano.");
    } finally {
      e.target.value = "";
    }
  };

  // Descarga la fórmula actual como Excel para que el usuario la edite y la vuelva a subir.
  const descargarExcel = async () => {
    const XLSX = await import("xlsx");
    const data = rows.map((f) => ({
      Cultivo: f.cultivo,
      Tipo: f.tipo ?? "",
      Insumo: f.insumo,
      "Dosis por ha": f.dosis,
      Unidad: f.unidad,
      "Costo por unidad": f.costoUnit,
    }));
    const ws = XLSX.utils.json_to_sheet(
      data.length ? data : [{ Cultivo: "", Tipo: "", Insumo: "", "Dosis por ha": "", Unidad: "", "Costo por unidad": "" }],
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calculadora");
    XLSX.writeFile(wb, "formula-valor-cliente.xlsx");
  };

  const guardarTipo = () => {
    const t = nuevoTipo.trim();
    if (!t) return;
    setTipos(addTipoInsumo(t));
    setNuevoTipo("");
    setTipoModal(false);
  };

  const guardar = () => {
    setFormula(rows.filter((r) => r.cultivo));
    setSaved(true);
    setMsg(null);
    setTimeout(() => setSaved(false), 1600);
    onSaved?.();
  };

  const numField =
    "w-full rounded-lg border border-line bg-white px-2 py-1.5 text-right text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";
  const txtField =
    "w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-[14px] font-semibold text-ink">
            Fórmula agronómica del valor cliente
          </p>
          <p className="text-[12px] text-ink-muted">
            El costo por hectárea de cada cultivo sale de la dosis y el precio de sus insumos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={descargarExcel}
            className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <FileSpreadsheet size={15} /> Descargar Excel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Upload size={15} /> Importar / subir Excel
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={onFile}
        />
      </div>

      <p className="text-[12px] text-ink-soft">
        Podés descargar el Excel actual, modificarlo o completarlo, y volver a subirlo para
        actualizar la fórmula.
      </p>

      {fileName && (
        <p className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-[12px] text-ink-soft">
          <FileText size={14} className="text-ink-muted" /> Adjunto: <span className="font-medium">{fileName}</span>
          {fileUrl && (
            <a href={fileUrl} download={fileName} className="ml-auto flex items-center gap-1 text-primary">
              <Download size={13} /> Descargar
            </a>
          )}
        </p>
      )}
      {msg && <p className="text-[12px] text-ink-soft">{msg}</p>}

      {cultivosEnUso.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFiltro(null)}
            className={`rounded-pill px-3 py-1 text-[12px] font-medium transition-colors ${
              filtro === null ? "bg-primary text-white" : "border border-line text-ink-soft hover:bg-surface"
            }`}
          >
            Todos
          </button>
          {cultivosEnUso.map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`rounded-pill px-3 py-1 text-[12px] font-medium transition-colors ${
                filtro === c ? "bg-primary text-white" : "border border-line text-ink-soft hover:bg-surface"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-2 py-1 font-medium">Cultivo</th>
              <th className="px-2 py-1 font-medium">Tipo</th>
              <th className="px-2 py-1 font-medium">Insumo</th>
              <th className="px-2 py-1 text-right font-medium">Dosis/ha</th>
              <th className="px-2 py-1 font-medium">Unidad</th>
              <th className="px-2 py-1 text-right font-medium">Costo unit.</th>
              <th className="px-2 py-1 text-right font-medium">Costo/ha</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              if (filtro && f.cultivo !== filtro) return null;
              return (
                <tr key={i} className="border-t border-line">
                  <td className="w-28 px-2 py-1.5">
                    <select
                      value={f.cultivo}
                      onChange={(e) => patch(i, { cultivo: e.target.value })}
                      className={txtField}
                    >
                      {CULTIVOS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="w-28 px-2 py-1.5">
                    <select
                      value={f.tipo ?? ""}
                      onChange={(e) => patch(i, { tipo: e.target.value || undefined })}
                      className={txtField}
                    >
                      <option value="">—</option>
                      {tipos.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="min-w-[130px] px-2 py-1.5">
                    <input
                      value={f.insumo}
                      onChange={(e) => patch(i, { insumo: e.target.value })}
                      className={txtField}
                      placeholder="Insumo"
                    />
                  </td>
                  <td className="w-20 px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={f.dosis}
                      onChange={(e) => patch(i, { dosis: num(e.target.value) })}
                      className={numField}
                    />
                  </td>
                  <td className="w-20 px-2 py-1.5">
                    <input
                      value={f.unidad}
                      onChange={(e) => patch(i, { unidad: e.target.value })}
                      className={txtField}
                      placeholder="u"
                    />
                  </td>
                  <td className="w-24 px-2 py-1.5">
                    <input
                      type="number"
                      step="0.01"
                      value={f.costoUnit}
                      onChange={(e) => patch(i, { costoUnit: num(e.target.value) })}
                      className={numField}
                    />
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold text-accent">
                    {formatUsd((f.dosis || 0) * (f.costoUnit || 0))}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      onClick={() => setRows((rs) => rs.filter((_, n) => n !== i))}
                      aria-label="Quitar insumo"
                      className="text-ink-muted hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() =>
            setRows((rs) => [
              ...rs,
              {
                cultivo: filtro ?? CULTIVOS[0],
                tipo: "",
                insumo: "",
                dosis: 0,
                unidad: "",
                costoUnit: 0,
              },
            ])
          }
          className="flex items-center gap-1 text-[13px] font-semibold text-primary"
        >
          <Plus size={15} /> Agregar insumo
        </button>
        <button
          onClick={() => setTipoModal(true)}
          className="flex items-center gap-1 text-[13px] font-semibold text-primary"
        >
          <Plus size={15} /> Agregar tipo
        </button>
      </div>

      <div className="rounded-2xl bg-surface p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Costo por hectárea resultante
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(costos).map(([c, v]) => (
            <span
              key={c}
              className="rounded-pill bg-white px-2.5 py-1 text-[12px] font-medium text-ink shadow-card"
            >
              {c}: <span className="text-accent">{formatUsd(v)}/ha</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={guardar}
          className="press rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {saved ? "Aplicada al valor cliente" : "Guardar fórmula y aplicar al valor cliente"}
        </button>
      </div>

      <Drawer open={tipoModal} onClose={() => setTipoModal(false)} title="Agregar tipo de insumo">
        <div className="space-y-3">
          <p className="text-[13px] text-ink-soft">
            El nuevo tipo se suma al listado y queda disponible en cada insumo de la fórmula.
          </p>
          <Field label="Nombre del tipo" value={nuevoTipo} onChange={setNuevoTipo} placeholder="Ej.: Bioestimulante" />
          <div className="flex flex-wrap gap-1.5">
            {tipos.map((t) => (
              <span key={t} className="rounded-pill bg-surface px-2.5 py-0.5 text-[12px] text-ink-soft">
                {t}
              </span>
            ))}
          </div>
          <PrimaryButton disabled={!nuevoTipo.trim()} onClick={guardarTipo}>
            Guardar tipo
          </PrimaryButton>
        </div>
      </Drawer>
    </div>
  );
}
