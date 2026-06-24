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
