import type { NotaCampo, Operacion, Producto, Productor, Referido } from "../types";

// Datos de ejemplo para el modo local (sin backend). Con backend, los datos
// salen del seed del servidor.
export const DEMO_PRODUCTOS: Producto[] = [
  { id: "prod-1", codigo: "SEM-MAI-01", nombre: "Semilla Maíz DK72-10", empresa: "Dekalb", principioActivo: "Maíz híbrido", presentacion: "Bolsa 80.000 sem.", precio1: 300, precio2: 290, precio3: 280, stock: 120 },
  { id: "prod-2", codigo: "SEM-SOJ-01", nombre: "Semilla Soja DM53i54", empresa: "Don Mario", principioActivo: "Soja grupo IV", presentacion: "Bolsa 40 kg", precio1: 180, precio2: 172, precio3: 165, stock: 150 },
  { id: "prod-3", codigo: "HER-GLI-01", nombre: "Glifosato Premium", empresa: "Atanor", principioActivo: "Glifosato", presentacion: "Bidón 20 L", precio1: 5, precio2: 4.7, precio3: 4.4, stock: 5000 },
  { id: "prod-4", codigo: "HER-24D-01", nombre: "Herbicida 2,4-D", empresa: "YPF Agro", principioActivo: "2,4-D", presentacion: "Bidón 20 L", precio1: 6, precio2: 5.7, precio3: 5.4, stock: 800 },
  { id: "prod-5", codigo: "FUN-AZO-01", nombre: "Fungicida Azox", empresa: "Syngenta", principioActivo: "Azoxistrobina", presentacion: "Bidón 5 L", precio1: 35, precio2: 33, precio3: 31, stock: 200 },
  { id: "prod-6", codigo: "INS-CIP-01", nombre: "Insecticida Ciper", empresa: "Red Surcos", principioActivo: "Cipermetrina", presentacion: "Bidón 5 L", precio1: 12, precio2: 11.4, precio3: 10.8, stock: 300 },
  { id: "prod-7", codigo: "FER-URE-01", nombre: "Urea Granulada", empresa: "Profertil", principioActivo: "Nitrógeno 46%", presentacion: "Tonelada", precio1: 520, precio2: 505, precio3: 490, stock: 80 },
  { id: "prod-8", codigo: "FER-DAP-01", nombre: "Fertilizante DAP", empresa: "Bunge", principioActivo: "Fósforo/Nitrógeno", presentacion: "Tonelada", precio1: 680, precio2: 660, precio3: 640, stock: 60 },
];

export function demoProductores(): Productor[] {
  const now = Date.now();
  return [
    {
      id: "p1",
      razonSocial: "Estancia La Esperanza S.A.",
      localidad: "Pergamino",
      telefono: "+54 2477 412345",
      email: "compras@laesperanza.com.ar",
      contactos: [{ nombre: "Oscar Juliá", rolContacto: "Contacto principal", celular: "+54 9 2477 512345" }],
      unidades: [
        {
          id: "p1-u1",
          lng: -60.5736,
          lat: -33.8895,
          cultivos: [
            { id: "p1-c1", cultivo: "Maíz", superficieHa: 300, facturado: 79000 },
            { id: "p1-c2", cultivo: "Soja", superficieHa: 150, facturado: 22000 },
          ],
        },
      ],
      updatedAt: now,
    },
    {
      id: "p2",
      razonSocial: "Agropecuaria Don Alfredo",
      localidad: "Venado Tuerto",
      celular: "+54 9 3462 540321",
      contactos: [{ nombre: "Alfredo Sosa", rolContacto: "Contacto principal", celular: "+54 9 3462 540321" }],
      unidades: [
        {
          id: "p2-u1",
          cultivos: [{ id: "p2-c1", cultivo: "Soja", superficieHa: 200, facturado: 30000 }],
        },
      ],
      updatedAt: now,
    },
    {
      id: "p3",
      razonSocial: "Establecimiento El Ombú",
      localidad: "Junín",
      contactos: [{ nombre: "Marta Ferreyra", rolContacto: "Contacto principal", celular: "+54 9 2364 530210" }],
      unidades: [
        {
          id: "p3-u1",
          cultivos: [{ id: "p3-c1", cultivo: "Maíz", superficieHa: 250, facturado: 0 }],
        },
      ],
      updatedAt: now,
    },
  ];
}

export interface VendedorMetrica {
  nombre: string;
  objetivo: number;
  logrado: number;
  referidos: number;
}

export const DEMO_VENDEDORES: VendedorMetrica[] = [
  { nombre: "Martín Suárez", objetivo: 267000, logrado: 187000, referidos: 7 },
  { nombre: "Lucía Fernández", objetivo: 219000, logrado: 160000, referidos: 11 },
  { nombre: "Diego Romero", objetivo: 260000, logrado: 177000, referidos: 4 },
];

export function demoNotas(): NotaCampo[] {
  const day = 86400000;
  const t = Date.now();
  const base = [
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Maíz", actividad: "negociacion", medio: "Campo", nota: "Interesado en cerrar semilla y herbicida para la campaña.", por: "Martín Suárez" },
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Soja", actividad: "presupuesto", medio: "Oficina cliente", nota: "Enviado presupuesto de semilla.", por: "Martín Suárez" },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", actividad: "visita_campo", medio: "Campo", nota: "Recorrida de lote, evaluación de malezas.", por: "Lucía Fernández" },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", actividad: "venta", medio: "Oficina cliente", nota: "Cerró parte de la semilla.", por: "Lucía Fernández" },
    { productorId: "p3", productorNombre: "Establecimiento El Ombú", cultivo: "Maíz", actividad: "inicio_contacto", medio: "Email", nota: "Primer contacto, agendar visita.", por: "Diego Romero" },
  ] as const;
  return base.map((b, i) => ({
    id: `nota-${i + 1}`,
    fechaContacto: new Date(t - (base.length - i) * day).toISOString(),
    productorId: b.productorId,
    productorNombre: b.productorNombre,
    cultivo: b.cultivo,
    medio: b.medio as NotaCampo["medio"],
    actividad: b.actividad as NotaCampo["actividad"],
    notaVisita: b.nota,
    creadoPor: b.por,
    updatedAt: t - (base.length - i) * day,
  }));
}

export function demoReferidos(): Referido[] {
  const t = Date.now();
  const rows: Array<Omit<Referido, "id" | "updatedAt">> = [
    { nombre: "Juan Pérez", referidor: "Nicolás Díaz", proceso: "en_proceso", movil: "+54 9 2477 511111", observaciones: "Recontactar la semana próxima." },
    { nombre: "Laura Méndez", referidor: "Juan Pérez", proceso: "presupuesto", movil: "+54 9 3462 522222", observaciones: "Presupuesto de semilla de soja enviado." },
    { nombre: "Sergio Díaz", referidor: "Lucía Fernández", proceso: "visita", movil: "+54 9 2364 533333", observaciones: "Visita al campo agendada." },
    { nombre: "Marta Quiroga", referidor: "Nicolás Díaz", proceso: "venta", movil: "+54 9 11 5444 4444", observaciones: "Cerró compra de fertilizante." },
    { nombre: "Pablo Sosa", referidor: "Diego Romero", proceso: "no_venta", observaciones: "Ya trabaja con otro proveedor." },
  ];
  return rows.map((r, i) => ({ ...r, id: `ref-${i + 1}`, updatedAt: t - i * 3600000 }));
}

export function demoOperaciones(): Operacion[] {
  const t = Date.now();
  const day = 86400000;
  const rows: Array<Omit<Operacion, "id" | "updatedAt">> = [
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Maíz", producto: "Semilla", valorPotencial: 20000, etapa: "negociacion", estado: "abierta", fechaInicio: new Date(t - 10 * day).toISOString() },
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Maíz", producto: "Glifosato", valorPotencial: 4500, etapa: "presupuesto", estado: "abierta", fechaInicio: new Date(t - 8 * day).toISOString() },
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Soja", producto: "Semilla", valorPotencial: 3000, etapa: "venta", estado: "ganada", fechaInicio: new Date(t - 20 * day).toISOString(), montoFacturado: 3000 },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", producto: "Inoculante", valorPotencial: 720, etapa: "en_proceso", estado: "abierta", fechaInicio: new Date(t - 6 * day).toISOString() },
  ];
  return rows.map((r, i) => ({ ...r, id: `op-${i + 1}`, updatedAt: t - i * 3600000 }));
}
