// Descarga un CSV (separado por comas). Lleva BOM para que Excel abra las tildes
// y ñ correctamente, y escapa comillas, comas y saltos de línea.
export function descargarCsv(nombre: string, filas: Record<string, unknown>[]): void {
  if (!filas.length) return;
  const cols = Object.keys(filas[0]);
  const esc = (v: unknown): string => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [cols.join(","), ...filas.map((f) => cols.map((c) => esc(f[c])).join(","))];
  const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Exporta filas a un Excel descargable. El lector/escritor se carga bajo demanda
// para no pesar el arranque.
export async function exportarExcel(nombre: string, filas: Record<string, unknown>[]): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${nombre}-${fecha}.xlsx`);
}
