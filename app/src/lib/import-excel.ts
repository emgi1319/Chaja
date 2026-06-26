import type { Producto } from "../types";
import { saveProducto } from "./api";
import { newId } from "./db";

// Importa un catálogo de productos desde un Excel/CSV. Mapea las columnas por
// nombre de encabezado de forma flexible (insensible a may/min y a variantes).
export async function importarProductosExcel(file: File): Promise<number> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return 0;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  let n = 0;
  for (const r of rows) {
    const keys = Object.keys(r);
    const pick = (...needles: string[]): unknown => {
      const k = keys.find((key) => needles.some((nd) => key.toLowerCase().includes(nd)));
      return k ? r[k] : undefined;
    };
    const str = (v: unknown): string | undefined => {
      const s = String(v ?? "").trim();
      return s || undefined;
    };
    const numOf = (v: unknown): number | undefined => {
      const x = parseFloat(
        String(v ?? "")
          .replace(/[^\d.,-]/g, "")
          .replace(",", "."),
      );
      return isNaN(x) ? undefined : x;
    };

    const nombre = str(pick("producto", "nombre", "descrip"));
    if (!nombre) continue;

    const prod: Producto = {
      id: newId(),
      nombre,
      codigo: str(pick("código", "codigo", "sku")),
      categoria: str(pick("categor", "rubro")),
      empresa: str(pick("marca", "empresa", "proveedor", "laborator")),
      principioActivo: str(pick("principio", "activo")),
      presentacion: str(pick("present", "envase")),
      precio1: numOf(pick("precio 1", "precio1", "precio")),
      precio2: numOf(pick("precio 2", "precio2")),
      precio3: numOf(pick("precio 3", "precio3")),
      stock: numOf(pick("stock", "existencia")),
    };
    await saveProducto(prod);
    n++;
  }
  return n;
}
