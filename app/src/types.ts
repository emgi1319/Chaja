export type Rol = "vendedor" | "supervisor" | "gerente" | "superadmin";

// El rol "gerente" se presenta como Líder de equipo: conserva la clave interna
// para no migrar los datos ya cargados.
export const ROL_LABEL: Record<Rol, string> = {
  vendedor: "Vendedor",
  supervisor: "Supervisor",
  gerente: "Líder de equipo",
  superadmin: "Super admin",
};

export function rolLabel(rol: string): string {
  return ROL_LABEL[rol as Rol] ?? rol;
}

export interface User {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
  grupo?: string | null;
}

export interface Entity {
  id: string;
  updatedAt: number;
  synced?: boolean;
  // Cuenta dueña del registro; la asigna el servidor y habilita el modo sombra.
  owner?: string;
}

export type AnuncioAudiencia = "todos" | "rol" | "grupo" | "usuario";
export type AnuncioTema = "azul" | "verde" | "ambar" | "oscuro";
export type AnuncioFormato = "imagen" | "imagen_texto" | "texto";

// Campaña de comunicación que el super admin publica y aparece a los usuarios
// destinatarios sobre el contenido de cada pantalla.
export interface Anuncio {
  id: string;
  formato: AnuncioFormato;
  titulo: string;
  texto?: string;
  imagen?: string;
  enlace?: string;
  audiencia: AnuncioAudiencia;
  rol?: Rol;
  grupo?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  tema: AnuncioTema;
  activo: boolean;
  createdAt: number;
}

export interface Producto {
  id: string;
  codigo?: string;
  categoria?: string;
  nombre: string;
  empresa?: string;
  principioActivo?: string;
  presentacion?: string;
  precio1?: number;
  precio2?: number;
  precio3?: number;
  stock?: number;
}

export interface Contacto {
  nombre: string;
  rolContacto?: string;
  dni?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  email?: string;
  fechaNacimiento?: string;
  preferenciasDeportivas?: string;
  hobbys?: string;
  situacionFamiliar?: string;
  redes?: string;
  perfilPersonal?: string;
  otros?: string;
}

export interface InsumoLinea {
  producto: string;
  codigo?: string;
  unidad?: string;
  unidadXHa: number;
  usdXUnidad: number;
  facturacionAnterior: number;
}

export interface Cultivo {
  id: string;
  cultivo: string;
  superficieHa: number;
  facturado: number;
  // Canasta de insumos del cultivo. Si está presente, el valor potencial y el
  // facturado del cultivo se calculan a partir de ella (modelo del cliente).
  // Si está vacía, se usa el costo/ha plano de Parámetros como fallback.
  insumos?: InsumoLinea[];
}

export interface Campania {
  nombre: string;
  inicio: string;
  cierre: string;
}

export interface FacturacionMes {
  periodo: string;
  monto: number;
}

// Fila de la fórmula agronómica: un insumo del costo por hectárea de un cultivo.
// El costo/ha de cada cultivo = suma de (dosis x costoUnit) de sus insumos.
export interface FormulaInsumo {
  cultivo: string;
  tipo?: string;
  insumo: string;
  dosis: number;
  unidad: string;
  costoUnit: number;
}

export const CULTIVOS = ["Maíz", "Soja", "Trigo", "Girasol", "Cebada", "Sorgo"] as const;

export interface UnidadProductiva {
  id: string;
  lng?: number;
  lat?: number;
  cultivos: Cultivo[];
}

export interface Productor extends Entity {
  razonSocial: string;
  vendedor?: string;
  campania?: string;
  cuitRut?: string;
  direccion?: string;
  localidad?: string;
  cp?: string;
  departamento?: string;
  pais?: string;
  telefono?: string;
  celular?: string;
  email?: string;
  redes?: string;
  web?: string;
  anioInicio?: string;
  zonasProduccion?: string;
  creditoAcordado?: number;
  contactos: Contacto[];
  potencialPct?: number;
  fidelidad?: string;
  liderazgo?: string;
  referidor?: string;
  propietarioOArrendatario?: string;
  codigoClasificacion?: string;
  scoringCrediticio?: string;
  facturacion2023?: number;
  facturacion2024?: number;
  facturacion2025?: number;
  unidades: UnidadProductiva[];
  facturacionMensual?: FacturacionMes[];
  creadoPor?: string;
}

export const ESTADOS_PROCESO = [
  "inicio_contacto",
  "completar_datos",
  "agenda_visita",
  "carga_valor_cliente",
  "visita_campo",
  "reunion_oficina",
  "asesoria",
  "presupuesto",
  "en_proceso",
  "negociacion",
  "venta",
  "no_venta",
  "facturacion",
  "cobranza",
  "otros",
] as const;

export type EstadoProceso = (typeof ESTADOS_PROCESO)[number];

export const ESTADO_PROCESO_LABEL: Record<EstadoProceso, string> = {
  inicio_contacto: "Inicio de contacto",
  completar_datos: "Completar datos",
  agenda_visita: "Agenda de visita",
  carga_valor_cliente: "Carga valor cliente",
  visita_campo: "Visita a campo",
  reunion_oficina: "Reunión en oficina",
  asesoria: "Asesoría",
  presupuesto: "Presupuesto",
  en_proceso: "En proceso",
  negociacion: "Negociación",
  venta: "Venta",
  no_venta: "No venta",
  facturacion: "Facturación",
  cobranza: "Cobranza",
  otros: "Otros",
};

export const MEDIOS_CONTACTO = ["Email", "Campo", "Agronomía", "Oficina cliente", "Otro"] as const;
export type MedioContacto = (typeof MEDIOS_CONTACTO)[number];

export interface NotaCampo extends Entity {
  fechaContacto: string;
  productorId: string;
  productorNombre: string;
  cultivo?: string;
  medio?: MedioContacto;
  actividad: EstadoProceso;
  notaVisita: string;
  creadoPor?: string;
}

export const ESTADOS_REFERIDO = [
  "envie_email",
  "envie_wp",
  "no_contesta",
  "respondido",
  "visita",
  "presupuesto",
  "en_proceso",
  "no_venta",
  "venta",
] as const;

export type EstadoReferido = (typeof ESTADOS_REFERIDO)[number];

export interface Referido extends Entity {
  nombre: string;
  email?: string;
  movil?: string;
  referidor?: string;
  proceso: EstadoReferido;
  hobbys?: string;
  deportes?: string;
  estadoCivil?: string;
  edadAprox?: string;
  fechaNacimiento?: string;
  observaciones?: string;
  hectareas?: number;
  creadoPor?: string;
}

export const ESTADOS_OPERACION = ["abierta", "ganada", "perdida"] as const;
export type EstadoOperacion = (typeof ESTADOS_OPERACION)[number];

export const ESTADO_OPERACION_LABEL: Record<EstadoOperacion, string> = {
  abierta: "Abierta",
  ganada: "Ganada",
  perdida: "Perdida",
};

export interface Operacion extends Entity {
  productorId: string;
  productorNombre: string;
  cultivo: string;
  producto: string;
  valorPotencial: number;
  etapa: EstadoProceso;
  estado: EstadoOperacion;
  fechaInicio: string;
  montoFacturado?: number;
  creadoPor?: string;
}
