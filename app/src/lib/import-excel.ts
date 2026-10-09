import type { Producto, Productor, Rol, Contacto, Cultivo } from "../types";
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
      unidad: str(pick("unidad")),
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

    // Busca una columna por su número (1, 2, 3). El nº 1 acepta la columna sin número
    // ("Contacto", "Email") y rechaza las que dicen 2 o 3; el nº 2/3 exige ese dígito.
    const pickN = (variante: number, ...needles: string[]): unknown => {
      const k = keys.find((key) => {
        const kl = key.toLowerCase();
        if (!needles.some((nd) => kl.includes(nd))) return false;
        if (variante === 1) return !kl.includes("2") && !kl.includes("3");
        return kl.includes(String(variante));
      });
      return k ? r[k] : undefined;
    };

    // Nombre de la empresa/cliente. Se prioriza el establecimiento; si no está, se
    // aceptan otras variantes de encabezado para no dejar el nombre vacío.
    const razonSocial =
      str(pick("establecimiento", "razón social", "razon social", "razón", "razon", "finca", "productor")) ??
      str(pick("empresa", "cliente", "nombre"));
    if (!razonSocial) continue;

    // Hasta dos personas de contacto, cada una con su email y teléfono.
    const contactos: Contacto[] = [];
    for (const i of [1, 2]) {
      const nombre = str(pickN(i, "contacto", "responsable", "referente", "persona", "asesor"));
      const mail = str(pickN(i, "email", "correo", "mail"));
      const tel = str(pickN(i, "teléfono", "telefono", "celular", "tel"));
      const cargo = str(pickN(i, "cargo", "puesto", "rol"));
      if (nombre || (i === 1 && (mail || tel))) {
        contactos.push({ nombre: nombre ?? razonSocial, email: mail, telefono: tel, rolContacto: cargo });
      }
    }

    // Hasta tres cultivos en una sola fila.
    const cultivos: Cultivo[] = [];
    const facturado = numOf(pick("facturado")) ?? 0;
    for (const i of [1, 2, 3]) {
      const cultivo = str(pickN(i, "cultivo"));
      const ha = numOf(pickN(i, "hectá", "hecta", " ha", "has"));
      if (cultivo || ha) {
        cultivos.push({
          id: newId(),
          cultivo: cultivo ?? "Maíz",
          superficieHa: ha ?? 0,
          facturado: i === 1 ? facturado : 0,
        });
      }
    }

    const prod: Productor = {
      id: newId(),
      razonSocial,
      vendedor: str(pick("vendedor", "asignado")),
      localidad: str(pick("localidad", "ciudad")),
      cuitRut: str(pick("cuit", "fiscal", "rut")),
      email: contactos[0]?.email,
      telefono: contactos[0]?.telefono,
      creditoAcordado: numOf(pick("crédito", "credito")),
      contactos,
      unidades: [{ id: newId(), cultivos }],
      updatedAt: Date.now(),
    };
    await productores.save(prod);
    n++;
  }
  return n;
}
