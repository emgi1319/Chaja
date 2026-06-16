export type Rol = "vendedor" | "supervisor" | "gerente";

export interface User {
  id: string;
  nombre: string;
  usuario: string;
  rol: Rol;
}

export interface Entity {
  id: string;
  updatedAt: number;
  synced?: boolean;
}

export interface Producto {
  id: string;
  codigo?: string;
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
  variedad?: string;
  superficieHa: number;
  otros?: string;
  insumos: InsumoLinea[];
}

export interface UnidadProductiva {
  id: string;
  lng?: number;
  lat?: number;
  cultivos: Cultivo[];
}

export interface Productor extends Entity {
  razonSocial: string;
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
  creadoPor?: string;
}

export const ESTADOS_PROCESO = [
  "inicio_contacto",
  "completar_datos",
  "agenda_visita",
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
  observaciones?: string;
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
