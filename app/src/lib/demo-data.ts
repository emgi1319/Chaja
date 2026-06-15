import type { NotaCampo, Producto, Productor } from "../types";

// Datos de ejemplo para la demostración local. Se reemplazan por el catálogo y
// la cartera reales del cliente una vez confirmado el Hito 1.
export const DEMO_PRODUCTOS: Producto[] = [
  {
    id: "prod-1",
    codigo: "SEM-MZ-7210",
    nombre: "Semilla de maíz DK 7210 VT3P",
    empresa: "Dekalb",
    principioActivo: "Maíz híbrido",
    presentacion: "Bolsa 80.000 semillas",
    precio1: 320,
    precio2: 308,
    precio3: 300,
    stock: 120,
  },
  {
    id: "prod-2",
    codigo: "SEM-SJ-46I20",
    nombre: "Semilla de soja DM 46i20",
    empresa: "Don Mario",
    principioActivo: "Soja grupo IV",
    presentacion: "Bolsa 40 kg",
    precio1: 95,
    precio2: 90,
    precio3: 86,
    stock: 200,
  },
  {
    id: "prod-3",
    codigo: "SEM-TR-620",
    nombre: "Semilla de trigo Baguette 620",
    empresa: "Nidera",
    principioActivo: "Trigo pan",
    presentacion: "Bolsa 25 kg",
    precio1: 42,
    precio2: 40,
    precio3: 38,
    stock: 150,
  },
  {
    id: "prod-4",
    codigo: "HRB-GLI-62",
    nombre: "Glifosato 62%",
    empresa: "Atanor",
    principioActivo: "Glifosato",
    presentacion: "Bidón 20 L",
    precio1: 4.5,
    precio2: 4.3,
    precio3: 4.1,
    stock: 800,
  },
  {
    id: "prod-5",
    codigo: "HRB-ATZ-50",
    nombre: "Atrazina 50%",
    empresa: "Red Surcos",
    principioActivo: "Atrazina",
    presentacion: "Bidón 20 L",
    precio1: 6.2,
    precio2: 5.9,
    precio3: 5.6,
    stock: 300,
  },
  {
    id: "prod-6",
    codigo: "INS-CIP-25",
    nombre: "Cipermetrina 25%",
    empresa: "Chemotecnica",
    principioActivo: "Cipermetrina",
    presentacion: "Bidón 5 L",
    precio1: 12,
    precio2: 11.4,
    precio3: 10.8,
    stock: 180,
  },
  {
    id: "prod-7",
    codigo: "FUN-AZX-CPZ",
    nombre: "Azoxistrobina + Ciproconazole",
    empresa: "Syngenta",
    principioActivo: "Azoxistrobina/Ciproconazole",
    presentacion: "Bidón 5 L",
    precio1: 38,
    precio2: 36,
    precio3: 34,
    stock: 90,
  },
  {
    id: "prod-8",
    codigo: "FER-UREA",
    nombre: "Urea granulada",
    empresa: "Profertil",
    principioActivo: "Nitrógeno 46%",
    presentacion: "Big bag 1.000 kg",
    precio1: 520,
    precio2: 505,
    precio3: 490,
    stock: 60,
  },
  {
    id: "prod-9",
    codigo: "FER-DAP",
    nombre: "Fosfato diamónico (DAP)",
    empresa: "Bunge",
    principioActivo: "Fósforo 46% / Nitrógeno 18%",
    presentacion: "Big bag 1.000 kg",
    precio1: 700,
    precio2: 680,
    precio3: 660,
    stock: 45,
  },
  {
    id: "prod-10",
    codigo: "INO-SOJ",
    nombre: "Inoculante para soja",
    empresa: "Rizobacter",
    principioActivo: "Bradyrhizobium",
    presentacion: "Dosis 50 ha",
    precio1: 180,
    precio2: 172,
    precio3: 165,
    stock: 100,
  },
];

export function demoProductores(): Productor[] {
  const now = Date.now();
  return [
    {
      id: "p1",
      razonSocial: "Estancia La Esperanza S.A.",
      cuitRut: "30-71234567-9",
      localidad: "Pergamino",
      departamento: "Buenos Aires",
      pais: "Argentina",
      telefono: "+54 2477 412345",
      celular: "+54 9 2477 512345",
      email: "compras@laesperanza.com.ar",
      anioInicio: "1998",
      zonasProduccion: "Pergamino, Colón",
      creditoAcordado: 250000,
      potencialPct: 75,
      fidelidad: "Alta",
      propietarioOArrendatario: "Propietario",
      codigoClasificacion: "C1",
      facturacion2023: 98000,
      facturacion2024: 112000,
      facturacion2025: 126000,
      contactos: [
        {
          nombre: "Oscar Juliá",
          rolContacto: "Contacto principal",
          celular: "+54 9 2477 512345",
          email: "oscar@laesperanza.com.ar",
        },
      ],
      unidades: [
        {
          id: "p1-u1",
          lng: -60.5736,
          lat: -33.8895,
          cultivos: [
            {
              id: "p1-c1",
              cultivo: "Maíz",
              variedad: "DK 7210",
              superficieHa: 300,
              insumos: [
                { producto: "Semilla", unidadXHa: 1, usdXUnidad: 300, facturacionAnterior: 70000 },
                { producto: "Glifosato", unidadXHa: 10, usdXUnidad: 4.5, facturacionAnterior: 9000 },
              ],
            },
            {
              id: "p1-c2",
              cultivo: "Soja",
              variedad: "DM 46i20",
              superficieHa: 150,
              insumos: [
                { producto: "Semilla", unidadXHa: 1, usdXUnidad: 180, facturacionAnterior: 24000 },
                { producto: "Herbicida", unidadXHa: 10, usdXUnidad: 4.5, facturacionAnterior: 0 },
              ],
            },
          ],
        },
      ],
      updatedAt: now,
    },
    {
      id: "p2",
      razonSocial: "Agropecuaria Don Alfredo",
      cuitRut: "30-70987654-3",
      localidad: "Venado Tuerto",
      departamento: "Santa Fe",
      pais: "Argentina",
      celular: "+54 9 3462 540321",
      email: "alfredo@donalfredo.com.ar",
      anioInicio: "2005",
      zonasProduccion: "Venado Tuerto",
      potencialPct: 55,
      fidelidad: "Media",
      propietarioOArrendatario: "Arrendatario",
      codigoClasificacion: "C2",
      facturacion2024: 41000,
      facturacion2025: 47000,
      contactos: [
        { nombre: "Alfredo Sosa", rolContacto: "Contacto principal", celular: "+54 9 3462 540321" },
      ],
      unidades: [
        {
          id: "p2-u1",
          cultivos: [
            {
              id: "p2-c1",
              cultivo: "Soja",
              variedad: "DM 46i20",
              superficieHa: 200,
              insumos: [
                { producto: "Semilla", unidadXHa: 1, usdXUnidad: 180, facturacionAnterior: 30000 },
                { producto: "Inoculante", unidadXHa: 0.02, usdXUnidad: 180, facturacionAnterior: 0 },
              ],
            },
          ],
        },
      ],
      updatedAt: now,
    },
    {
      id: "p3",
      razonSocial: "Establecimiento El Ombú",
      localidad: "Junín",
      departamento: "Buenos Aires",
      pais: "Argentina",
      celular: "+54 9 2364 530210",
      potencialPct: 40,
      fidelidad: "Baja",
      propietarioOArrendatario: "Propietario",
      codigoClasificacion: "C3",
      contactos: [
        { nombre: "Marta Ferreyra", rolContacto: "Contacto principal", celular: "+54 9 2364 530210" },
      ],
      unidades: [
        {
          id: "p3-u1",
          cultivos: [
            {
              id: "p3-c1",
              cultivo: "Maíz",
              variedad: "DK 7210",
              superficieHa: 250,
              insumos: [
                { producto: "Semilla", unidadXHa: 1, usdXUnidad: 300, facturacionAnterior: 0 },
                { producto: "Urea", unidadXHa: 0.2, usdXUnidad: 520, facturacionAnterior: 0 },
              ],
            },
          ],
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
  { nombre: "Diego Romero", objetivo: 120000, logrado: 86000, referidos: 7 },
  { nombre: "Lucía Méndez", objetivo: 100000, logrado: 94000, referidos: 11 },
  { nombre: "Pablo Sosa", objetivo: 90000, logrado: 52000, referidos: 4 },
];

export function demoNotas(): NotaCampo[] {
  const day = 86400000;
  const t = Date.now();
  const base = [
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Maíz", actividad: "negociacion", medio: "Campo", nota: "Interesado en cerrar semilla y herbicida para la campaña.", por: "Diego Romero" },
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Soja", actividad: "presupuesto", medio: "Oficina cliente", nota: "Enviado presupuesto de semilla DM 46i20.", por: "Diego Romero" },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", actividad: "visita_campo", medio: "Campo", nota: "Recorrida de lote, evaluación de malezas.", por: "Lucía Méndez" },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", actividad: "venta", medio: "Oficina cliente", nota: "Cerró inoculante y parte de la semilla.", por: "Lucía Méndez" },
    { productorId: "p3", productorNombre: "Establecimiento El Ombú", cultivo: "Maíz", actividad: "inicio_contacto", medio: "Email", nota: "Primer contacto, agendar visita.", por: "Pablo Sosa" },
    { productorId: "p3", productorNombre: "Establecimiento El Ombú", cultivo: "Maíz", actividad: "agenda_visita", medio: "Agronomía", nota: "Visita coordinada para la próxima semana.", por: "Pablo Sosa" },
    { productorId: "p1", productorNombre: "Estancia La Esperanza S.A.", cultivo: "Maíz", actividad: "cobranza", medio: "Oficina cliente", nota: "Saldo de la operación anterior en gestión.", por: "Diego Romero" },
    { productorId: "p2", productorNombre: "Agropecuaria Don Alfredo", cultivo: "Soja", actividad: "en_proceso", medio: "Campo", nota: "Definiendo volumen de fertilizante.", por: "Lucía Méndez" },
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
