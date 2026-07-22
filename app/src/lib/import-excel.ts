import type { Producto, Productor, Rol } from "../types";
import { saveProducto, productores, crearUsuario } from "./api";
import { newId } from "./db";

export interface ImportCuentasResultado {
  creadas: number;
  errores: string[];
}

const ROLES_VALIDOS: Rol[] = ["vendedor", "supervisor", "gerente", "superadmin"];

function normalizarRol(v: unknown): Rol {
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  if (s.startsWith("super admin") || s === "superadmin" || s.startsWith("super")) return "superadmin";
  if (s.startsWith("gerent")) return "gerente";
  if (s.startsWith("supervis")) return "supervisor";
  return "vendedor";
}

// Alta masiva de cuentas desde CSV/Excel. Columnas flexibles: Nombre, Apellido,
// Usuario, Contraseña, Grupo (y Rol si no se fija uno). `rolFijo` fuerza el rol de
// todas las filas (lo elige el super admin en el dropdown de la carga masiva).
// Reporta por fila para que se vea cuáles no entraron y por qué.
export async function importarCuentasExcel(
  file: File,
  opts?: { rolFijo?: Rol },
): Promise<ImportCuentasResultado> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { creadas: 0, errores: ["El archivo no tiene ninguna hoja."] };
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  let creadas = 0;
  const errores: string[] = [];
  for (const [i, r] of rows.entries()) {
    const keys = Object.keys(r);
    const keyOf = (...needles: string[]): string | undefined =>
      keys.find((key) => needles.some((nd) => key.toLowerCase().includes(nd)));
    const pick = (...needles: string[]): unknown => {
      const k = keyOf(...needles);
      return k ? r[k] : undefined;
    };
    const str = (v: unknown): string => String(v ?? "").trim();

    const fila = i + 2;
    // Nombre y apellido pueden venir en columnas separadas: se combinan.
    const kNombre = keyOf("nombre");
    const kApellido = keyOf("apellido");
    const nombre = [
      kNombre ? str(r[kNombre]) : "",
      kApellido && kApellido !== kNombre ? str(r[kApellido]) : "",
    ]
      .filter(Boolean)
      .join(" ");
    const usuario = str(pick("usuario", "user", "login"));
    const password = str(pick("contrase", "clave", "password", "pass"));
    if (!nombre && !usuario) continue;
    if (!nombre || !usuario || !password) {
      errores.push(`Fila ${fila}: faltan nombre, usuario o contraseña.`);
      continue;
    }
    const rol = opts?.rolFijo ?? normalizarRol(pick("rol", "perfil", "tipo"));
    if (!ROLES_VALIDOS.includes(rol)) {
      errores.push(`Fila ${fila}: rol inválido.`);
      continue;
    }
    try {
      await crearUsuario({ nombre, usuario, password, rol, grupo: str(pick("grupo")) || undefined });
      creadas++;
    } catch {
      errores.push(`Fila ${fila}: no se pudo crear "${usuario}" (¿ya existe?).`);
    }
  }
  return { creadas, errores };
}

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

// Importa una base de clientes desde Excel/CSV. Toma los datos del productor y,
// si la fila trae cultivo/hectáreas, arma una unidad productiva inicial.
export async function importarClientesExcel(file: File): Promise<number> {
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

    const razonSocial = str(pick("establecimiento", "razón", "razon", "cliente", "nombre"));
    if (!razonSocial) continue;

    const ha = numOf(pick("hectá", "hecta", " ha"));
    const cultivo = str(pick("cultivo")) ?? "Maíz";
    const facturado = numOf(pick("facturado")) ?? 0;

    const prod: Productor = {
      id: newId(),
      razonSocial,
      vendedor: str(pick("vendedor", "asignado")),
      localidad: str(pick("localidad", "ciudad")),
      cuitRut: str(pick("cuit", "fiscal", "rut")),
      email: str(pick("email", "correo", "mail")),
      telefono: str(pick("teléfono", "telefono", "celular", "tel")),
      creditoAcordado: numOf(pick("crédito", "credito")),
      contactos: [],
      unidades: [
        {
          id: newId(),
          cultivos: ha ? [{ id: newId(), cultivo, superficieHa: ha, facturado }] : [],
        },
      ],
      updatedAt: Date.now(),
    };
    await productores.save(prod);
    n++;
  }
  return n;
}
