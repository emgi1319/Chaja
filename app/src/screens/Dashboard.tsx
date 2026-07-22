import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  BarChart3,
  LogOut,
  Search,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowLeft,
  Plus,
  Filter,
  Boxes,
  UserPlus,
  Calculator,
  Sliders,
  ClipboardCheck,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Gauge,
  AlertTriangle,
  Info,
  Sprout,
  Activity,
  Calendar,
  History,
  ArrowRight,
  Download,
  MapPin,
  Menu,
  Lightbulb,
  Shield,
  Megaphone,
  Eye,
  KeyRound,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { useApp } from "../store";
import {
  notasCampo,
  operaciones,
  pendingTotal,
  productores,
  referidos,
  saveProducto,
  registrarAuditoria,
  listarAuditoria,
  listarUsuarios,
  listarAnuncios,
  type AuditoriaEvento,
  type CuentaUsuario,
} from "../lib/api";
import { newId } from "../lib/db";
import { DateField, Dropdown, Field, PrimaryButton } from "../components/ui";
import { Drawer } from "../components/drawer";
import { ClienteForm } from "../components/cliente-form";
import { EditarDatosCliente } from "../components/editar-datos-cliente";
import { RegistrarVenta } from "../components/registrar-venta";
import { GestionUsuarios } from "../components/gestion-usuarios";
import { GestionCampanias } from "../components/gestion-campanias";
import { CambiarPassword } from "../components/cambiar-password";
import { AnunciosBanner } from "../components/anuncios-banner";
import { CargarActividad } from "../components/cargar-actividad";
import { FormulaAgronomica } from "../components/formula-agronomica";
import { exportarExcel } from "../lib/export";
import { importarClientesExcel, importarProductosExcel } from "../lib/import-excel";
import { scoringCliente, facturacionTotal } from "../lib/scoring";
import {
  InfoTip,
  PanelFacturado,
  PanelClientes,
  PanelOportunidad,
  PanelVendedor,
  PanelAlerta,
} from "../components/inicio-paneles";
import {
  CULTIVOS,
  ESTADOS_REFERIDO,
  ESTADO_PROCESO_LABEL,
  ESTADO_OPERACION_LABEL,
  type Campania,
  type Cultivo,
  type FacturacionMes,
  type EstadoOperacion,
  type EstadoProceso,
  type InsumoLinea,
  type Referido,
  type Anuncio,
  rolLabel,
} from "../types";
import {
  productoresRows,
  capturaPorCultivo,
  formatPct,
  seguimientoClientes,
  seguimientoStats,
  operacionesStats,
  referidosStats,
  campaignTotals,
  alertasPanel,
  vendedoresResumen,
  proximaAccion,
  semaforoTiempo,
  supervisorVendedores,
  supervisorStats,
  campEstado,
  serieMensual,
  type AlertaPanel,
} from "../lib/analytics";
import {
  formatUsd,
  valorCultivo,
  facturadoCultivo,
  oportunidadCultivo,
  inversionInsumo,
  valorClienteTotal,
} from "../lib/valor-cliente";
import {
  setCostosHa,
  getConfig,
  getObjetivoCampania,
  setObjetivoCampania,
  setNombreCampania,
  getCampanias,
  setCampanias,
} from "../lib/parametros";

type Section =
  | "inicio"
  | "clientes"
  | "seguimiento"
  | "operaciones"
  | "referidos"
  | "actividad"
  | "equipo"
  | "productos"
  | "valorcliente"
  | "parametros"
  | "reportes"
  | "supervisor"
  | "auditoria"
  | "facturacion"
  | "usuarios"
  | "campanias"
  | "plataforma";

const NAV: { key: Section; label: string; icon: typeof Users }[] = [
  { key: "plataforma", label: "Panel", icon: Gauge },
  { key: "inicio", label: "Inicio", icon: LayoutDashboard },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "seguimiento", label: "Seguimiento", icon: Filter },
  { key: "operaciones", label: "Operaciones", icon: Boxes },
  { key: "referidos", label: "Referidos", icon: UserPlus },
  { key: "actividad", label: "Agenda de actividades", icon: ClipboardCheck },
  { key: "equipo", label: "Equipo", icon: UserCheck },
  { key: "productos", label: "Productos", icon: Package },
  { key: "valorcliente", label: "Valor cliente", icon: Calculator },
  { key: "parametros", label: "Parámetros", icon: Sliders },
  { key: "reportes", label: "Reportes", icon: BarChart3 },
  { key: "supervisor", label: "Panel supervisor", icon: Activity },
  { key: "auditoria", label: "Auditoría", icon: History },
  { key: "facturacion", label: "Facturación", icon: DollarSign },
  { key: "usuarios", label: "Cuentas", icon: Shield },
  { key: "campanias", label: "Campañas", icon: Megaphone },
];

// Secciones visibles por perfil (el gerente ve todo). El supervisor ve clientes
// pero no carga actividad; el vendedor no ve equipo, reportes ni parámetros.
const RAIL_VEND: Section[] = [
  "inicio",
  "clientes",
  "valorcliente",
  "actividad",
  "seguimiento",
  "operaciones",
  "referidos",
  "productos",
];
const RAIL_SUP: Section[] = [
  "inicio",
  "clientes",
  "seguimiento",
  "operaciones",
  "referidos",
  "reportes",
  "supervisor",
  "parametros",
  "facturacion",
  "equipo",
  "productos",
];
// El super admin es el dueño de la plataforma: solo ve el estado del sistema,
// las cuentas y las campañas. Nada operativo (clientes, valor cliente, parámetros, etc.).
const RAIL_ADMIN: Section[] = ["plataforma", "usuarios", "campanias"];

const SECTION_TITLE: Record<Section, string> = {
  plataforma: "Panel de la plataforma",
  inicio: "Tablero de control",
  clientes: "Clientes y su Valor Cliente",
  seguimiento: "Seguimiento por cliente",
  operaciones: "Operaciones por cliente y producto",
  referidos: "Referidos: son tus nuevos clientes potenciales",
  actividad: "Agenda de actividades",
  equipo: "Equipo de ventas",
  productos: "Productos",
  valorcliente: "Valor cliente",
  parametros: "Toda la data clave en un solo lugar",
  reportes: "Reportes",
  supervisor: "Panel del supervisor",
  auditoria: "Auditoría de cambios",
  facturacion: "Facturación histórica y scoring",
  usuarios: "Gestión de cuentas",
  campanias: "Campañas y comunicados",
};

// Consigna que encabeza cada sección, para orientar al usuario sobre qué hace.
const SECTION_DESC: Record<Section, string> = {
  plataforma: "Estado general del sistema: cuentas, campañas y uso.",
  inicio: "Resumen de la campaña: avances, oportunidades y alertas.",
  clientes: "Cartera de productores: dónde estás y dónde podés llegar.",
  seguimiento: "Aquí la próxima acción a realizar con cada cliente.",
  operaciones: "Oportunidades de venta abiertas por producto y cultivo.",
  referidos: "Avances de los nuevos clientes potenciales.",
  actividad: "Registro del proceso sobre cada cliente.",
  equipo: "Desempeño de cada vendedor.",
  productos: "Catálogo de insumos con precios y presentaciones.",
  valorcliente: "El dato clave: calculá el potencial de compra de cada cliente por cultivo.",
  parametros: "Costos por hectárea, campañas y fórmulas de Valor Cliente.",
  reportes: "Comparativos de facturación, oportunidad y captura por vendedor y cultivo.",
  supervisor: "Cronograma de campañas y semáforo de avance por vendedor.",
  auditoria: "Historial de cambios sobre el Valor Cliente.",
  facturacion: "Carga mensual de facturación y scoring de cada cliente.",
  usuarios: "Alta, baja y roles de las cuentas del sistema.",
  campanias: "Publicá banners y comunicados para los usuarios del sistema.",
};

// Banner destacado de cada sección (copia del modo "Descripciones" del demo).
const SECTION_BANNER: Record<Section, { h: string; p: string }> = {
  plataforma: {
    h: "Tu plataforma, de una mirada",
    p: "Cuántas cuentas hay, qué campañas están activas y cuánto se está usando el sistema. Todo lo que el dueño necesita para controlar la herramienta.",
  },
  inicio: {
    h: "Tu negocio comercial, de un vistazo",
    p: "Las métricas clave, las acciones urgentes y la actividad reciente en una sola pantalla. Empezá el día sabiendo dónde están las oportunidades.",
  },
  clientes: {
    h: "Cada productor, con su historia completa",
    p: "Toda tu cartera ordenada: en qué etapa está cada cliente, su potencial y la próxima acción. La información queda en la empresa, no en una libreta.",
  },
  valorcliente: {
    h: "Cuánto vale cada cliente y cuánto falta capturar",
    p: "Calculá el potencial según las hectáreas y los cultivos de cada cliente, y descubrí la oportunidad que todavía está sobre la mesa.",
  },
  actividad: {
    h: "Registrá lo que pasa en el campo, en segundos",
    p: "Visitas, asesorías, presupuestos y ventas, cargados desde el celular o la oficina. Nada se pierde, todo queda documentado.",
  },
  seguimiento: {
    h: "Que ninguna oportunidad se enfríe",
    p: "Un semáforo te avisa qué clientes necesitan atención antes de que sea tarde. El seguimiento deja de depender de la memoria.",
  },
  operaciones: {
    h: "Seguí cada venta, producto por producto",
    p: "Mirá qué se está negociando, qué se ganó y qué se perdió, para enfocar el esfuerzo donde más rinde.",
  },
  referidos: {
    h: "Tus mejores clientes traen a los próximos",
    p: "Capturá y seguí los referidos para convertir la confianza de tus clientes en nuevas ventas.",
  },
  productos: {
    h: "Tu catálogo, siempre a mano",
    p: "Precios, presentaciones y stock actualizados, listos para armar un presupuesto en el momento.",
  },
  reportes: {
    h: "Decisiones con números, no con corazonadas",
    p: "La cartera por vendedor, la captura por cultivo y la evolución del negocio, claras y al instante.",
  },
  supervisor: {
    h: "Todo tu equipo bajo control, sin perseguir a nadie",
    p: "El avance de cada vendedor y el estado de cada campaña con semáforos. La gestión del equipo deja de vivir en el WhatsApp.",
  },
  parametros: {
    h: "Vos definís las reglas del juego",
    p: "Ajustá los costos por hectárea de cada cultivo y las fechas de cada campaña. El sistema se adapta a cómo trabaja tu empresa.",
  },
  equipo: {
    h: "Tu equipo comercial, en un solo lugar",
    p: "Quién es quién, sus carteras y su desempeño, para liderar con información y no con suposiciones.",
  },
  auditoria: {
    h: "Cada cambio deja huella",
    p: "El registro de quién modificó el Valor Cliente y cuándo, para decidir con trazabilidad y confianza.",
  },
  facturacion: {
    h: "La facturación que respalda el scoring",
    p: "Cargá la facturación mes a mes de cada cliente y obtené su scoring para priorizar dónde poner el foco.",
  },
  usuarios: {
    h: "Vos controlás quién entra y con qué permisos",
    p: "Creá y eliminá cuentas, y asigná el rol de cada una. El super admin gestiona el acceso de toda la empresa.",
  },
  campanias: {
    h: "Comunicá a tu red en el momento justo",
    p: "Publicá banners con imágenes y mensajes dirigidos a todos, a un tipo de usuario o a una cuenta puntual. Aparecen sobre el contenido de cada pantalla.",
  },
};

function SectionBanner({ section }: { section: Section }) {
  const b = SECTION_BANNER[section];
  const Icon = NAV.find((n) => n.key === section)?.icon ?? Lightbulb;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <h4 className="font-display text-[14px] font-semibold text-ink">{b.h}</h4>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink-soft">{b.p}</p>
      </div>
    </div>
  );
}

const REF_LABEL: Record<string, string> = {
  envie_email: "Envié email",
  envie_wp: "Envié WhatsApp",
  no_contesta: "No contesta",
  respondido: "Respondido",
  visita: "Visita",
  presupuesto: "Presupuesto",
  en_proceso: "En proceso",
  no_venta: "No venta",
  venta: "Venta",
};

function EtapaBadge({ etapa }: { etapa: EstadoProceso | null }) {
  if (!etapa) return <span className="text-[12px] text-ink-muted">Sin actividad</span>;
  const tone =
    etapa === "venta" || etapa === "facturacion" || etapa === "cobranza"
      ? "bg-accent/15 text-accent-dark"
      : etapa === "no_venta"
        ? "bg-danger/10 text-danger"
        : "bg-primary/10 text-primary-dark";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-medium ${tone}`}>
      {ESTADO_PROCESO_LABEL[etapa]}
    </span>
  );
}

function OpEstadoBadge({ estado }: { estado: EstadoOperacion }) {
  const tone =
    estado === "ganada"
      ? "bg-accent/15 text-accent-dark"
      : estado === "perdida"
        ? "bg-danger/10 text-danger"
        : "bg-amber/15 text-amber";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
      {ESTADO_OPERACION_LABEL[estado]}
    </span>
  );
}

function SemTiempoBadge({ ultimaFecha }: { ultimaFecha: string | null }) {
  const s = semaforoTiempo(ultimaFecha);
  const tone =
    s.kind === "verde"
      ? "bg-accent/15 text-accent-dark"
      : s.kind === "amarillo"
        ? "bg-amber/15 text-amber"
        : s.kind === "rojo"
          ? "bg-danger/10 text-danger"
          : "bg-surface text-ink-muted";
  const dot =
    s.kind === "verde"
      ? "bg-accent"
      : s.kind === "amarillo"
        ? "bg-amber"
        : s.kind === "rojo"
          ? "bg-danger"
          : "bg-ink-muted";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[12px] font-medium ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {s.label}
    </span>
  );
}

function Seguimiento() {
  const rows = seguimientoClientes();
  const s = seguimientoStats();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Users} label="Clientes" value={String(s.clientes)} />
        <Kpi icon={Target} label="Valor potencial" value={formatUsd(s.valorTotal)} tone="accent" />
        <Kpi icon={Filter} label="En proceso" value={String(s.enProceso)} />
        <Kpi icon={UserCheck} label="Ganados" value={String(s.ganados)} tone="accent" />
      </div>
      <TableShell
        head={["Cliente", "Vendedor", "Etapa", "Valor potencial", "Próxima acción", "Tiempo"]}
      >
        {rows.map((r) => (
          <tr
            key={r.productor.id}
            className="border-t border-line transition-colors hover:bg-surface"
          >
            <td className="px-4 py-3 font-medium text-ink">{r.productor.razonSocial}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.vendedor}</td>
            <td className="px-4 py-3 text-right">
              <EtapaBadge etapa={r.etapa} />
            </td>
            <td className="px-4 py-3 text-right font-semibold text-accent">{formatUsd(r.valor)}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{proximaAccion(r.etapa)}</td>
            <td className="px-4 py-3 text-right">
              <SemTiempoBadge ultimaFecha={r.ultimaFecha} />
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

function Operaciones() {
  const ops = operaciones.list();
  const s = operacionesStats();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Kpi icon={Boxes} label="Operaciones" value={String(s.total)} />
        <Kpi icon={Target} label="Valor en juego" value={formatUsd(s.valorEnJuego)} tone="amber" />
        <Kpi icon={UserCheck} label="Ganadas" value={String(s.ganadas)} tone="accent" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() =>
            void exportarExcel(
              "operaciones",
              ops.map((o) => ({
                ID: o.id,
                Cliente: o.productorNombre,
                Cultivo: o.cultivo,
                Producto: o.producto,
                Valor: Math.round(o.valorPotencial),
                Etapa: o.etapa,
                Estado: o.estado,
              })),
            )
          }
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Download size={16} /> Exportar
        </button>
      </div>
      <TableShell head={["Cliente", "Cultivo", "Producto", "Valor", "Etapa", "Estado"]}>
        {ops.map((o) => (
          <tr key={o.id} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{o.productorNombre}</p>
              <p className="text-[11px] uppercase text-ink-muted">{o.id}</p>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{o.cultivo}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{o.producto}</td>
            <td className="px-4 py-3 text-right font-semibold text-accent">
              {formatUsd(o.valorPotencial)}
            </td>
            <td className="px-4 py-3 text-right">
              <EtapaBadge etapa={o.etapa} />
            </td>
            <td className="px-4 py-3 text-right">
              <OpEstadoBadge estado={o.estado} />
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}

const CATEGORIAS = [
  "Semilla",
  "Herbicida",
  "Fungicida",
  "Insecticida",
  "Fertilizante",
  "Coadyuvante",
  "Inoculante",
  "Curasemilla",
  "Otros",
];

function numv(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function ReferidoForm({ onSaved }: { onSaved: () => void }) {
  const user = useApp((s) => s.user);
  const [nombre, setNombre] = useState("");
  const [referidor, setReferidor] = useState("");
  const [email, setEmail] = useState("");
  const [movil, setMovil] = useState("");
  const [proceso, setProceso] = useState<string>("envie_email");
  const [observaciones, setObservaciones] = useState("");
  const [cultivos, setCultivos] = useState<{ id: string; cultivo: string; ha: string }[]>([
    { id: newId(), cultivo: "Maíz", ha: "" },
  ]);
  const [estadoCivil, setEstadoCivil] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [hobbys, setHobbys] = useState("");
  const [deportes, setDeportes] = useState("");
  const [saving, setSaving] = useState(false);
  const haTotal = cultivos.reduce((a, c) => a + numv(c.ha), 0);
  const valorPotencial = cultivos.reduce(
    (a, c) => a + valorCultivo({ id: c.id, cultivo: c.cultivo, superficieHa: numv(c.ha), facturado: 0 }),
    0,
  );
  const patchCultivo = (id: string, p: Partial<{ cultivo: string; ha: string }>) =>
    setCultivos((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const guardar = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    await referidos.save({
      id: newId(),
      nombre: nombre.trim(),
      referidor,
      email,
      movil,
      proceso: proceso as Referido["proceso"],
      observaciones,
      hectareas: haTotal,
      estadoCivil,
      fechaNacimiento,
      hobbys,
      deportes,
      creadoPor: user?.nombre,
      updatedAt: Date.now(),
    });
    setSaving(false);
    onSaved();
  };
  return (
    <div className="space-y-3">
      <Field label="Nombre y apellido" value={nombre} onChange={setNombre} />
      <Field label="Referidor" value={referidor} onChange={setReferidor} />
      <Field label="Email" value={email} onChange={setEmail} inputMode="email" />
      <Field label="Móvil" value={movil} onChange={setMovil} inputMode="tel" />
      <DateField label="Fecha de nacimiento" value={fechaNacimiento} onChange={setFechaNacimiento} />
      <Field label="Estado civil" value={estadoCivil} onChange={setEstadoCivil} />
      <Dropdown
        label="Proceso"
        value={proceso}
        options={ESTADOS_REFERIDO.map((e) => ({ value: e as string, label: REF_LABEL[e] ?? e }))}
        onChange={setProceso}
      />
      <div className="space-y-2 rounded-2xl border border-line p-3">
        <div className="flex items-center justify-between">
          <span className="label">Cultivos</span>
          <button
            type="button"
            onClick={() => setCultivos((cs) => [...cs, { id: newId(), cultivo: "Maíz", ha: "" }])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
        {cultivos.map((c) => (
          <div key={c.id} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-6">
              <Dropdown
                value={c.cultivo}
                options={CULTIVOS.map((x) => ({ value: x as string, label: x }))}
                onChange={(v) => patchCultivo(c.id, { cultivo: v })}
              />
            </div>
            <input
              value={c.ha}
              onChange={(e) => patchCultivo(c.id, { ha: e.target.value })}
              placeholder="Ha"
              inputMode="decimal"
              className="col-span-3 rounded-xl border border-line bg-white px-2 py-2.5 text-right text-[13px] outline-none"
            />
            <span className="col-span-2 text-right text-[12px] font-semibold text-accent">
              {formatUsd(
                valorCultivo({ id: c.id, cultivo: c.cultivo, superficieHa: numv(c.ha), facturado: 0 }),
              )}
            </span>
            <button
              type="button"
              onClick={() => setCultivos((cs) => (cs.length > 1 ? cs.filter((x) => x.id !== c.id) : cs))}
              className="col-span-1 p-1 text-ink-muted active:opacity-60"
              aria-label="Quitar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-2 text-[13px]">
          <span className="text-ink-muted">{haTotal} ha · valor potencial</span>
          <span className="font-semibold text-accent">{formatUsd(valorPotencial)}</span>
        </div>
      </div>
      <Field label="Hobbys" value={hobbys} onChange={setHobbys} />
      <Field label="Deportes" value={deportes} onChange={setDeportes} />
      <label className="block space-y-1.5">
        <span className="label">Observaciones</span>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={2}
          className="field"
        />
      </label>
      <div className="sticky bottom-0 -mx-5 -mb-4 border-t border-line bg-white px-5 py-3">
        <PrimaryButton disabled={saving || !nombre.trim()} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar referido"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function ProductoForm({ onSaved }: { onSaved: () => void }) {
  const refresh = useApp((s) => s.refresh);
  const [codigo, setCodigo] = useState("");
  const [categoria, setCategoria] = useState<string>("Semilla");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [presentacion, setPresentacion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const guardar = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    await saveProducto({
      id: newId(),
      codigo,
      categoria,
      nombre: nombre.trim(),
      empresa,
      presentacion,
      precio1: numv(precio),
      stock: numv(stock),
    });
    await refresh();
    setSaving(false);
    onSaved();
  };
  return (
    <div className="space-y-3">
      <Field label="Código" value={codigo} onChange={setCodigo} />
      <Dropdown
        label="Categoría"
        value={categoria}
        options={CATEGORIAS.map((c) => ({ value: c, label: c }))}
        onChange={setCategoria}
      />
      <Field label="Nombre" value={nombre} onChange={setNombre} />
      <Field label="Marca" value={empresa} onChange={setEmpresa} />
      <Field label="Presentación" value={presentacion} onChange={setPresentacion} />
      <Field label="Precio (U$S)" value={precio} onChange={setPrecio} inputMode="decimal" />
      <Field label="Stock" value={stock} onChange={setStock} inputMode="numeric" />
      <div className="sticky bottom-0 -mx-5 -mb-4 border-t border-line bg-white px-5 py-3">
        <PrimaryButton disabled={saving || !nombre.trim()} onClick={guardar}>
          {saving ? "Guardando…" : "Guardar producto"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Referidos() {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const rs = useMemo(() => referidos.list(), [version]);
  const s = useMemo(() => referidosStats(), [version]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={UserPlus} label="Referidos" value={String(s.total)} />
        <Kpi icon={Filter} label="En gestión" value={String(s.enGestion)} />
        <Kpi icon={UserCheck} label="Ventas" value={String(s.ventas)} tone="accent" />
        <Kpi icon={TrendingUp} label="Conversión" value={formatPct(s.conversion)} tone="accent" />
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Plus size={17} /> Nuevo referido
        </button>
      </div>
      <TableShell head={["Referido", "Vendedor", "Referidor", "Proceso", "Ha"]}>
        {rs.map((r) => (
          <tr key={r.id} className="border-t border-line transition-colors hover:bg-surface">
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{r.nombre}</p>
              {r.observaciones && <p className="text-[11px] text-ink-muted">{r.observaciones}</p>}
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.creadoPor || "—"}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.referidor || "—"}</td>
            <td className="px-4 py-3 text-right">
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                {REF_LABEL[r.proceso] ?? r.proceso}
              </span>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.hectareas ?? "—"}</td>
          </tr>
        ))}
      </TableShell>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nuevo referido">
        <ReferidoForm
          onSaved={() => {
            setOpen(false);
            setVersion((v) => v + 1);
          }}
        />
      </Drawer>
    </div>
  );
}

function Bar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "accent" | "amber" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  const color = tone === "accent" ? "bg-accent" : tone === "amber" ? "bg-amber" : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-pill bg-line">
      <div
        className={`h-2 rounded-pill transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${Math.min(100, Math.max(2, w))}%` }}
      />
    </div>
  );
}

function CapturaBadge({ pct }: { pct: number }) {
  const tone =
    pct >= 0.7
      ? "bg-accent/15 text-accent-dark"
      : pct >= 0.4
        ? "bg-amber/15 text-amber"
        : "bg-danger/10 text-danger";
  return (
    <span className={`rounded-pill px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
      {formatPct(pct)}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "ink",
  onClick,
  tip,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: "ink" | "accent" | "amber";
  onClick?: () => void;
  tip?: string;
}) {
  const valueColor = tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber" : "text-ink";
  const chip =
    tone === "accent"
      ? "bg-accent/10 text-accent"
      : tone === "amber"
        ? "bg-amber/10 text-amber"
        : "bg-primary/10 text-primary";
  const inner = (
    <>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl md:h-11 md:w-11 ${chip}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="w-full min-w-0">
        <p className="flex items-center gap-1 text-[12px] text-ink-muted">
          {label}
          {tip && <InfoTip texto={tip} />}
        </p>
        <p
          className={`font-display text-[18px] font-bold leading-tight tabular-nums sm:text-[20px] md:text-[23px] ${valueColor}`}
        >
          {value}
        </p>
      </div>
    </>
  );
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="card card-hover flex w-full flex-col items-start gap-2.5 text-left sm:flex-row sm:items-center sm:gap-3.5"
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="card card-hover flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3.5">
      {inner}
    </div>
  );
}

function TableShell({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead className="bg-surface text-left text-ink-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Inicio() {
  const t = campaignTotals();
  const objetivo = getObjetivoCampania() || t.potencial;
  const avance = objetivo > 0 ? t.facturado / objetivo : 0;
  const alertas = alertasPanel();
  const ranking = vendedoresResumen();
  const maxFact = Math.max(1, ...ranking.map((v) => v.facturado));
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const refresh = useApp((s) => s.refresh);
  const user = useApp((s) => s.user);
  const [panel, setPanel] = useState<
    | null
    | { tipo: "facturado" | "oportunidad" | "clientes" }
    | { tipo: "vendedor"; nombre: string }
    | { tipo: "alerta"; alerta: AlertaPanel }
  >(null);
  const serie = serieMensual();

  return (
    <div className="space-y-6">
      {user?.rol !== "supervisor" && (
        <div className="flex justify-end">
          <button
            onClick={() => setNuevoOpen(true)}
            className="press flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={17} /> Nuevo cliente
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label="Facturado campaña"
          value={formatUsd(t.facturado)}
          onClick={() => setPanel({ tipo: "facturado" })}
        />
        <Kpi
          icon={TrendingUp}
          label="Oportunidad detectada"
          value={formatUsd(t.oportunidad)}
          tone="amber"
          onClick={() => setPanel({ tipo: "oportunidad" })}
          tip="Potencial no capturado: el valor cliente total (fórmula agronómica) menos lo facturado."
        />
        <Kpi
          icon={Gauge}
          label="% capturado"
          value={formatPct(t.captura)}
          tip="Facturado sobre el potencial total de la cartera (lo que cada productor invertiría según la fórmula agronómica)."
        />
        <Kpi
          icon={Users}
          label="Clientes activos"
          value={String(t.clientes)}
          onClick={() => setPanel({ tipo: "clientes" })}
        />
      </div>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[15px] font-semibold text-ink">Objetivo de campaña</h2>
          <span className="text-[13px] text-ink-muted">
            {formatUsd(t.facturado)} / {formatUsd(objetivo)}
          </span>
        </div>
        <div className="mt-3">
          <Bar pct={avance * 100} tone="accent" />
        </div>
        <p className="mt-1.5 text-[12px] text-ink-muted">{formatPct(avance)} del objetivo alcanzado</p>
      </section>

      {user?.rol !== "vendedor" && (
        <section className="card">
          <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
            Ranking de vendedores
            <InfoTip texto="Ordenado por facturación. El porcentaje es la captura del vendedor: facturado sobre el potencial de su cartera. Tocá un vendedor para ver el detalle." />
          </h2>
          <div className="mt-3 space-y-1">
            {ranking.map((v) => {
              const ini = v.vendedor
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <button
                  key={v.vendedor}
                  onClick={() => setPanel({ tipo: "vendedor", nombre: v.vendedor })}
                  className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-surface"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[12px] font-semibold text-primary-dark">
                    {ini}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-ink">{v.vendedor}</span>
                      <span className="text-ink-muted">
                        {formatUsd(v.facturado)} · {formatPct(v.captura)}
                      </span>
                    </div>
                    <div className="mt-1">
                      <Bar pct={(v.facturado / maxFact) * 100} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
          Alertas y próximas acciones
          <InfoTip texto="Se generan automáticamente de tu cartera y las reglas del sistema. Tocá una para ver el detalle y de dónde sale." />
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {alertas.map((a, i) => {
            const style =
              a.nivel === "alta"
                ? { border: "border-l-danger", chip: "bg-danger/10 text-danger", Icon: AlertTriangle }
                : a.nivel === "media"
                  ? { border: "border-l-amber", chip: "bg-amber/10 text-amber", Icon: Clock }
                  : { border: "border-l-primary", chip: "bg-primary/10 text-primary", Icon: Info };
            return (
              <button
                key={i}
                onClick={() => setPanel({ tipo: "alerta", alerta: a })}
                className={`card flex w-full items-start gap-3 border-l-4 text-left transition-colors hover:bg-surface ${style.border}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.chip}`}>
                  <style.Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{a.titulo}</p>
                  <p className="text-[12px] leading-snug text-ink-soft">{a.detalle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Drawer
        open={panel !== null}
        onClose={() => setPanel(null)}
        title={
          panel?.tipo === "facturado"
            ? "Facturado de campaña"
            : panel?.tipo === "oportunidad"
              ? "Oportunidad detectada"
              : panel?.tipo === "clientes"
                ? "Clientes activos"
                : panel?.tipo === "vendedor"
                  ? panel.nombre
                  : panel?.tipo === "alerta"
                    ? panel.alerta.titulo
                    : ""
        }
      >
        {panel?.tipo === "facturado" && <PanelFacturado serie={serie} />}
        {panel?.tipo === "oportunidad" && <PanelOportunidad />}
        {panel?.tipo === "clientes" && <PanelClientes serie={serie} />}
        {panel?.tipo === "vendedor" && <PanelVendedor nombre={panel.nombre} />}
        {panel?.tipo === "alerta" && <PanelAlerta alerta={panel.alerta} />}
      </Drawer>

      <Drawer open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo cliente">
        <ClienteForm
          onSaved={() => {
            setNuevoOpen(false);
            void refresh();
          }}
        />
      </Drawer>
    </div>
  );
}

function formatFecha(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DatoFicha({ label, valor }: { label: string; valor?: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{valor || "—"}</dd>
    </div>
  );
}

function ClienteDetalle({ id, onBack }: { id: string; onBack: () => void }) {
  const productor = productores.get(id);
  const row = productoresRows().find((r) => r.productor.id === id);
  const [histOpen, setHistOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bcraOpen, setBcraOpen] = useState(false);
  const [ventaOpen, setVentaOpen] = useState(false);
  const [, bump] = useState(0);

  if (!productor || !row) return null;

  const notas = notasCampo
    .list()
    .filter((n) => n.productorId === id)
    .sort((a, b) => new Date(b.fechaContacto).getTime() - new Date(a.fechaContacto).getTime());
  const cultivos = productor.unidades.flatMap((u) => u.cultivos);
  const inicial = productor.razonSocial
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const meta = [
    productor.localidad,
    row.hectareas ? `${row.hectareas} ha` : null,
    productor.vendedor ? `Vendedor: ${productor.vendedor}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const kpis: { label: string; value: string; tone?: "amber" }[] = [
    { label: "Valor potencial", value: formatUsd(row.potencial) },
    { label: "Facturado ciclo anterior", value: formatUsd(row.facturado) },
    { label: "Oportunidad", value: formatUsd(row.oportunidad), tone: "amber" },
    { label: "% capturado", value: formatPct(row.captura) },
  ];
  const maxVol = Math.max(1, ...productores.list().map(facturacionTotal));
  const scoreCliente = scoringCliente(productor, maxVol);

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} /> Volver a clientes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-[15px] font-bold text-primary-dark">
            {inicial}
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold text-ink">{productor.razonSocial}</h2>
            <p className="text-[13px] text-ink-soft">{meta || "—"}</p>
            {productor.unidades[0]?.lat != null && productor.unidades[0]?.lng != null && (
              <a
                href={`https://www.google.com/maps?q=${productor.unidades[0].lat},${productor.unidades[0].lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
              >
                <MapPin size={12} /> Ver ubicación en el mapa
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setHistOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Clock size={16} /> Historial
          </button>
          <button
            onClick={() => setVentaOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-[14px] font-semibold text-accent-dark transition-colors hover:bg-accent/15"
          >
            <DollarSign size={16} /> Registrar venta
          </button>
          <button
            onClick={() => setActOpen(true)}
            className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={16} /> Cargar actividad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <p className="text-[12px] text-ink-muted">{k.label}</p>
            <p
              className={`mt-1 font-display text-[24px] font-bold ${
                k.tone === "amber" ? "text-amber" : "text-ink"
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-amber/10 px-5 py-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber/15">
          <Target size={24} className="text-amber" />
        </div>
        <div>
          <p className="text-[12px] font-medium text-amber">
            Objetivo de venta sugerido para esta campaña
          </p>
          <p className="font-display text-[20px] font-bold text-ink">
            {formatUsd(row.oportunidad)} a capturar
          </p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-[14px] font-semibold text-ink">Datos del cliente</h3>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-pill px-2.5 py-0.5 text-[12px] font-semibold ${
                scoreCliente.categoria === "Alto"
                  ? "bg-accent/10 text-accent-dark"
                  : scoreCliente.categoria === "Medio"
                    ? "bg-amber/15 text-amber"
                    : "bg-danger/10 text-danger"
              }`}
            >
              Scoring {scoreCliente.score}/100 · {scoreCliente.categoria}
            </span>
            <button
              onClick={() => setBcraOpen(true)}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Situación crediticia BCRA
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Editar
            </button>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px] sm:grid-cols-3">
          <DatoFicha label="Número fiscal (CUIT)" valor={productor.cuitRut} />
          <DatoFicha label="Email" valor={productor.email} />
          <DatoFicha label="Teléfono" valor={productor.telefono} />
          <DatoFicha
            label="Crédito otorgado"
            valor={productor.creditoAcordado != null ? formatUsd(productor.creditoAcordado) : undefined}
          />
          <DatoFicha label="Scoring crediticio" valor={productor.scoringCrediticio} />
          <DatoFicha label="Localidad" valor={productor.localidad} />
        </dl>
      </div>

      <Drawer open={bcraOpen} onClose={() => setBcraOpen(false)} title="Situación crediticia BCRA">
        <div className="space-y-2">
          <p className="text-[12px] text-ink-muted">
            Central de deudores del BCRA. Consultá con el CUIT del cliente
            {productor.cuitRut ? `: ${productor.cuitRut}` : ""}.
          </p>
          <iframe
            src="https://www.bcra.gob.ar/situacion-crediticia/"
            title="Situación crediticia BCRA"
            className="h-[65vh] w-full rounded-xl border border-line bg-white"
          />
          <a
            href="https://www.bcra.gob.ar/situacion-crediticia/"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[12px] font-medium text-primary hover:underline"
          >
            Abrir en una pestaña nueva
          </a>
        </div>
      </Drawer>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)} title="Editar datos del cliente">
        <EditarDatosCliente
          id={id}
          onSaved={() => {
            setEditOpen(false);
            bump((n) => n + 1);
          }}
        />
      </Drawer>

      {cultivos.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-muted">Por cultivo</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cultivos.map((c) => {
              const pot = valorCultivo(c);
              const fact = facturadoCultivo(c);
              const op = oportunidadCultivo(c);
              const cap = pot > 0 ? (fact / pot) * 100 : 0;
              return (
                <div key={c.id} className="card">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
                      <Sprout size={16} className="text-accent" /> {c.cultivo}
                    </span>
                    <span className="text-[12px] text-ink-muted">{c.superficieHa} ha</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-soft">
                    Pot. {formatUsd(pot)} · Fact. {formatUsd(fact)}
                  </p>
                  <p className="text-[12px] text-ink-soft">Oportunidad {formatUsd(op)}</p>
                  <div className="mt-2">
                    <Bar pct={cap} tone="accent" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cultivos.some((c) => c.insumos && c.insumos.length > 0) && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-muted">Detalle por producto</p>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-[13px]">
              <thead className="bg-surface text-left text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 text-right font-medium">Inv. potencial</th>
                  <th className="px-4 py-3 text-right font-medium">Facturado ant.</th>
                  <th className="px-4 py-3 text-right font-medium">Oportunidad</th>
                </tr>
              </thead>
              <tbody>
                {cultivos.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="bg-surface/60">
                      <td colSpan={4} className="px-4 py-2 text-[12px] font-semibold text-ink-soft">
                        {c.cultivo} · {c.superficieHa} ha
                      </td>
                    </tr>
                    {(c.insumos ?? []).map((ins, idx) => {
                      const pot = inversionInsumo(ins, c.superficieHa);
                      const op = pot - (ins.facturacionAnterior || 0);
                      return (
                        <tr key={idx} className="border-t border-line">
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{ins.producto}</p>
                            <p className="text-[11px] text-ink-muted">
                              {ins.unidadXHa} {ins.unidad ?? "u"}/ha × {formatUsd(ins.usdXUnidad)}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right text-ink-soft">{formatUsd(pot)}</td>
                          <td className="px-4 py-3 text-right text-ink-soft">
                            {formatUsd(ins.facturacionAnterior || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber">{formatUsd(op)}</td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-line bg-surface/40">
                  <td className="px-4 py-3 font-semibold text-ink">Total cliente</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatUsd(row.potencial)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatUsd(row.facturado)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-accent">
                    {formatUsd(row.oportunidad)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={histOpen} onClose={() => setHistOpen(false)} title="Historial">
        {notas.length === 0 ? (
          <p className="text-[13px] text-ink-muted">Sin actividades registradas todavía.</p>
        ) : (
          <ol>
            {notas.map((n, i) => (
              <li key={n.id} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      n.actividad === "venta"
                        ? "bg-accent"
                        : n.actividad === "no_venta"
                          ? "bg-danger"
                          : "bg-primary"
                    }`}
                  />
                  {i < notas.length - 1 && <span className="w-px flex-1 bg-line" />}
                </div>
                <div className="-mt-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-ink">
                      {ESTADO_PROCESO_LABEL[n.actividad]}
                    </span>
                    <span className="text-[11px] text-ink-muted">{formatFecha(n.fechaContacto)}</span>
                  </div>
                  {n.notaVisita && <p className="text-[12px] text-ink-soft">{n.notaVisita}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Drawer>

      <Drawer open={ventaOpen} onClose={() => setVentaOpen(false)} title="Registrar venta">
        <RegistrarVenta
          id={id}
          onSaved={() => {
            setVentaOpen(false);
            bump((n) => n + 1);
          }}
        />
      </Drawer>

      <Drawer open={actOpen} onClose={() => setActOpen(false)} title="Cargar actividad">
        <CargarActividad
          enDrawer
          productorId={id}
          onSaved={() => {
            setActOpen(false);
            bump((v) => v + 1);
          }}
        />
      </Drawer>
    </div>
  );
}

function Clientes() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);
  const [version, setVersion] = useState(0);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const all = useMemo(() => productoresRows(), [version]);

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importarClientesExcel(file);
      setVersion((v) => v + 1);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return all;
    return all.filter(
      (r) =>
        r.productor.razonSocial.toLowerCase().includes(t) ||
        (r.productor.localidad ?? "").toLowerCase().includes(t),
    );
  }, [q, all]);

  if (selected) return <ClienteDetalle id={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-2xl border border-transparent bg-white px-3 shadow-card transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
          <Search size={18} className="text-ink-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente"
            className="w-full bg-transparent py-2.5 text-[14px] outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              void exportarExcel(
                "clientes",
                all.map((r) => ({
                  Cliente: r.productor.razonSocial,
                  Vendedor: r.productor.vendedor ?? "",
                  Localidad: r.productor.localidad ?? "",
                  Hectareas: r.hectareas,
                  "Valor potencial": Math.round(r.potencial),
                  Facturado: Math.round(r.facturado),
                  Oportunidad: Math.round(r.oportunidad),
                  "Captura %": Math.round(r.captura * 100),
                })),
              )
            }
            className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <Download size={16} /> Exportar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-60"
          >
            <Download size={16} className="rotate-180" />
            {importing ? "Importando…" : "Importar"}
          </button>
          <button
            onClick={() => setNuevoOpen(true)}
            className="press flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
          >
            <Plus size={17} /> Nuevo cliente
          </button>
        </div>
      </div>

      <TableShell
        head={["Cliente", "Vendedor", "Ha", "Potencial", "Facturado", "Oportunidad", "% captura"]}
      >
        {rows.map((r) => (
          <tr
            key={r.productor.id}
            onClick={() => setSelected(r.productor.id)}
            className="cursor-pointer border-t border-line transition-colors hover:bg-surface"
          >
            <td className="px-4 py-3">
              <p className="font-medium text-ink">{r.productor.razonSocial}</p>
              <p className="text-[11px] text-ink-muted">{r.productor.localidad || "—"}</p>
            </td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.productor.vendedor || "—"}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{r.hectareas}</td>
            <td className="px-4 py-3 text-right font-semibold text-accent">{formatUsd(r.potencial)}</td>
            <td className="px-4 py-3 text-right text-ink-soft">{formatUsd(r.facturado)}</td>
            <td className="px-4 py-3 text-right text-amber">{formatUsd(r.oportunidad)}</td>
            <td className="px-4 py-3 text-right">
              <CapturaBadge pct={r.captura} />
            </td>
          </tr>
        ))}
      </TableShell>

      <Drawer open={nuevoOpen} onClose={() => setNuevoOpen(false)} title="Nuevo cliente">
        <ClienteForm
          onSaved={() => {
            setNuevoOpen(false);
            setVersion((v) => v + 1);
          }}
        />
      </Drawer>
    </div>
  );
}

function Equipo() {
  const vendedores = vendedoresResumen();
  const [detalle, setDetalle] = useState<string | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {vendedores.map((v) => {
        const ini = v.vendedor
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <button
            key={v.vendedor}
            onClick={() => setDetalle(v.vendedor)}
            className="card card-hover space-y-2 text-left"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-[12px] font-semibold text-primary-dark">
                {ini}
              </div>
              <p className="font-display text-[15px] font-semibold text-ink">{v.vendedor}</p>
            </div>
            <p className="text-[13px] text-ink-muted">
              {v.clientes} cliente{v.clientes === 1 ? "" : "s"} · {v.hectareas} ha
            </p>
            <p className="text-[13px] text-ink-soft">
              Facturado <span className="font-semibold text-ink">{formatUsd(v.facturado)}</span>
            </p>
            <p className="text-[13px] text-ink-soft">
              Oportunidad <span className="font-semibold text-amber">{formatUsd(v.oportunidad)}</span>
            </p>
            <Bar pct={v.captura * 100} tone={v.captura >= 0.7 ? "accent" : "amber"} />
            <p className="text-[12px] text-ink-muted">{formatPct(v.captura)} capturado</p>
          </button>
        );
      })}
      <Drawer
        open={detalle != null}
        onClose={() => setDetalle(null)}
        title={detalle ?? ""}
      >
        {detalle && <PanelVendedor nombre={detalle} />}
      </Drawer>
    </div>
  );
}

function Productos() {
  const catalogo = useApp((s) => s.catalogo);
  const refresh = useApp((s) => s.refresh);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importarProductosExcel(file);
      await refresh();
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onImport}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface disabled:opacity-60"
        >
          <Download size={16} className="rotate-180" />
          {importing ? "Importando…" : "Importar Excel"}
        </button>
        <button
          onClick={() => setOpen(true)}
          className="press flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-[14px] font-semibold text-white shadow-card transition-colors hover:bg-primary-dark"
        >
          <Plus size={17} /> Nuevo producto
        </button>
      </div>
      <TableShell head={["Producto", "Categoría", "Marca", "Presentación", "Precio", "Stock"]}>
      {catalogo.map((p) => (
        <tr key={p.id} className="border-t border-line transition-colors hover:bg-surface">
          <td className="px-4 py-3">
            <p className="font-medium text-ink">{p.nombre}</p>
            <p className="text-[11px] text-ink-muted">{p.codigo || p.principioActivo || "—"}</p>
          </td>
          <td className="px-4 py-3 text-right">
            {p.categoria ? (
              <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary-dark">
                {p.categoria}
              </span>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
          </td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.empresa || "—"}</td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.presentacion || "—"}</td>
          <td className="px-4 py-3 text-right font-semibold text-accent">
            {p.precio1 != null ? formatUsd(p.precio1) : "—"}
          </td>
          <td className="px-4 py-3 text-right text-ink-soft">{p.stock ?? "—"}</td>
        </tr>
      ))}
      </TableShell>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nuevo producto">
        <ProductoForm onSaved={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}

function Donut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const C = 2 * Math.PI * 42;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#EEF1F4" strokeWidth="14" />
        {data.map((d) => {
          const len = (d.value / total) * C;
          const el = (
            <circle
              key={d.label}
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={d.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="min-w-[120px] space-y-1.5 text-[13px]">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-ink-soft">{d.label}</span>
            <span className="ml-auto font-semibold text-ink">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Barras({
  data,
  tone = "primary",
}: {
  data: { label: string; value: number }[];
  tone?: "primary" | "accent" | "amber";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const color = tone === "accent" ? "bg-accent" : tone === "amber" ? "bg-amber" : "bg-primary";
  if (data.length === 0) return <p className="text-[12px] text-ink-muted">Sin datos.</p>;
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-0.5 flex items-center justify-between text-[12px]">
            <span className="text-ink-soft">{d.label}</span>
            <span className="font-medium text-ink-muted">{d.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-pill bg-line">
            <div className={`h-2 ${color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AreaLine({ puntos }: { puntos: { mes: string; valor: number }[] }) {
  const max = Math.max(1, ...puntos.map((p) => p.valor));
  const W = 280;
  const H = 90;
  const pad = 6;
  const stepX = puntos.length > 1 ? (W - pad * 2) / (puntos.length - 1) : 0;
  const pts = puntos.map((p, i) => {
    const x = pad + i * stepX;
    const y = H - pad - (p.valor / max) * (H - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = pts.length > 0 ? `${line} L${pts[pts.length - 1][0]},${H} L${pts[0][0]},${H} Z` : "";
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full">
        <path d={area} fill="#1B5E9B" opacity="0.12" />
        <path d={line} fill="none" stroke="#1B5E9B" strokeWidth="2" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#1B5E9B" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
        {puntos.map((p) => (
          <span key={p.mes}>{p.mes}</span>
        ))}
      </div>
    </div>
  );
}

function Reportes() {
  const cultivos = capturaPorCultivo();
  const ops = operaciones.list();
  const maxPot = Math.max(1, ...cultivos.map((c) => c.potencial));
  const opsPorEtapa = Object.entries(
    ops.reduce<Record<string, number>>((acc, o) => {
      acc[o.etapa] = (acc[o.etapa] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([etapa, value]) => ({
    label: ESTADO_PROCESO_LABEL[etapa as EstadoProceso] ?? etapa,
    value,
  }));
  const clientesPorEtapa = Object.entries(
    seguimientoClientes().reduce<Record<string, number>>((acc, r) => {
      const k = r.etapa ?? "sin";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([etapa, value]) => ({
    label:
      etapa === "sin" ? "Sin actividad" : (ESTADO_PROCESO_LABEL[etapa as EstadoProceso] ?? etapa),
    value,
  }));
  const alertasCredito = productores
    .list()
    .filter((p) => p.creditoAcordado && p.creditoAcordado > 0)
    .map((p) => ({ p, fact: facturacionTotal(p), credito: p.creditoAcordado as number }))
    .filter((x) => x.fact >= x.credito * 0.8)
    .sort((a, b) => b.fact / b.credito - a.fact / a.credito);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {alertasCredito.length > 0 && (
        <section className="card lg:col-span-2">
          <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold text-ink">
            <AlertTriangle size={16} className="text-amber" />
            Clientes cerca del crédito otorgado
          </h2>
          <p className="mt-1 text-[12px] text-ink-muted">
            Facturación acumulada sobre el crédito otorgado. En rojo, los que ya lo superaron.
          </p>
          <div className="mt-3 space-y-2.5">
            {alertasCredito.map(({ p, fact, credito }) => {
              const pct = Math.min(100, (fact / credito) * 100);
              const over = fact >= credito;
              return (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">{p.razonSocial}</span>
                    <span className={over ? "font-semibold text-danger" : "text-ink-muted"}>
                      {formatUsd(fact)} / {formatUsd(credito)} · {Math.round((fact / credito) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-pill bg-line">
                    <div
                      className={`h-2 ${over ? "bg-danger" : "bg-amber"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Captura por cultivo</h2>
        <div className="mt-3 space-y-3">
          {cultivos.map((c) => (
            <div key={c.cultivo}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-ink-soft">{c.cultivo}</span>
                <span className="text-ink-muted">
                  {formatUsd(c.facturado)} / {formatUsd(c.potencial)} · {formatPct(c.captura)}
                </span>
              </div>
              <Bar pct={(c.potencial / maxPot) * 100} tone="accent" />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">
          Cartera por vendedor — facturado vs oportunidad
        </h2>
        <div className="mt-3 space-y-4">
          {vendedoresResumen().map((v) => {
            const total = v.facturado + v.oportunidad;
            const facPct = total > 0 ? (v.facturado / total) * 100 : 0;
            return (
              <div key={v.vendedor}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink">{v.vendedor}</span>
                  <span className="text-ink-muted">{formatUsd(total)}</span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-pill bg-line">
                  <div className="h-2.5 bg-primary" style={{ width: `${facPct}%` }} />
                  <div className="h-2.5 bg-amber" style={{ width: `${100 - facPct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> Facturado
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber" /> Oportunidad
            </span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Operaciones por estado</h2>
        <div className="mt-4">
          <Donut
            data={[
              { label: "Abiertas", value: ops.filter((o) => o.estado === "abierta").length, color: "#D97706" },
              { label: "Ganadas", value: ops.filter((o) => o.estado === "ganada").length, color: "#1FA971" },
              { label: "Perdidas", value: ops.filter((o) => o.estado === "perdida").length, color: "#DC2626" },
            ]}
          />
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Evolución del facturado</h2>
        <div className="mt-4">
          <AreaLine puntos={serieMensual().map((p) => ({ mes: p.mes, valor: p.facturado }))} />
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Operaciones por etapa</h2>
        <div className="mt-3">
          <Barras tone="amber" data={opsPorEtapa} />
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Clientes por etapa</h2>
        <div className="mt-3">
          <Barras data={clientesPorEtapa} />
        </div>
      </section>
    </div>
  );
}

function Parametros({ onVolver }: { onVolver?: () => void }) {
  const cfg = getConfig();
  const refresh = useApp((s) => s.refresh);
  const [costos, setCostos] = useState<Record<string, number>>(cfg.costosHa);
  const [objetivo, setObjetivo] = useState<number>(cfg.objetivoCampania);
  const [nombre, setNombre] = useState<string>(cfg.nombreCampania);
  const [campanias, setCamps] = useState<Campania[]>(cfg.campanias.map((c) => ({ ...c })));
  const [saved, setSaved] = useState(false);
  const patchCamp = (i: number, p: Partial<Campania>) =>
    setCamps((cs) => cs.map((c, n) => (n === i ? { ...c, ...p } : c)));
  const guardar = () => {
    setCostosHa(costos);
    setObjetivoCampania(objetivo);
    setNombreCampania(nombre);
    setCampanias(campanias.filter((c) => c.nombre.trim()));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return (
    <div className="space-y-4">
      {onVolver && (
        <button
          onClick={onVolver}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Volver al panel del supervisor
        </button>
      )}
      <FormulaAgronomica onSaved={() => void refresh()} />
      <div className="card space-y-3">
        <p className="font-display text-[14px] font-semibold text-ink">Campaña</p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-ink">Nombre de campaña</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-40 rounded-xl border border-line bg-white px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:border-primary/40 focus:ring-primary/10"
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[14px] text-ink">Objetivo de facturación</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-muted">U$S</span>
            <input
              type="number"
              value={objetivo}
              onChange={(e) => setObjetivo(Number(e.target.value))}
              className="w-32 rounded-xl border border-line bg-white px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:border-primary/40 focus:ring-primary/10"
            />
          </div>
        </label>
        <p className="text-[12px] text-ink-muted">
          Si el objetivo queda en 0, el panel usa el potencial total de la cartera como meta.
        </p>
      </div>

      <p className="text-[13px] text-ink-muted">
        Costo por hectárea de cada cultivo. Lo fija el supervisor y se usa para calcular el valor
        potencial de cada cliente.
      </p>
      <div className="card divide-y divide-line py-1">
        {CULTIVOS.map((c) => (
          <div key={c} className="flex items-center justify-between py-2.5">
            <span className="text-[14px] text-ink">{c}</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-ink-muted">U$S/ha</span>
              <input
                type="number"
                value={costos[c] ?? 0}
                onChange={(e) => setCostos((s) => ({ ...s, [c]: Number(e.target.value) }))}
                className="w-28 rounded-xl border border-line bg-white px-3 py-2 text-right text-[14px] outline-none ring-2 ring-transparent transition-all focus:border-primary/40 focus:ring-primary/10"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[14px] font-semibold text-ink">Cronograma de campañas</p>
          <button
            type="button"
            onClick={() => setCamps((cs) => [...cs, { nombre: "", inicio: "", cierre: "" }])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={15} /> Agregar campaña
          </button>
        </div>
        <p className="text-[12px] text-ink-muted">
          Las fechas de cada campaña alimentan los semáforos del panel del supervisor.
        </p>
        {campanias.map((c, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <input
              value={c.nombre}
              onChange={(e) => patchCamp(i, { nombre: e.target.value })}
              placeholder="Ej.: Trigo 2026"
              className="col-span-5 rounded-lg border border-line bg-white px-2 py-2 text-[13px] outline-none"
            />
            <div className="col-span-3">
              <DateField
                value={c.inicio}
                onChange={(v) => patchCamp(i, { inicio: v })}
                className="w-full rounded-lg border border-line bg-white px-2 py-2 text-[12px] outline-none focus:border-primary/40"
              />
            </div>
            <div className="col-span-3">
              <DateField
                value={c.cierre}
                onChange={(v) => patchCamp(i, { cierre: v })}
                className="w-full rounded-lg border border-line bg-white px-2 py-2 text-[12px] outline-none focus:border-primary/40"
              />
            </div>
            <button
              type="button"
              onClick={() => setCamps((cs) => cs.filter((_, n) => n !== i))}
              aria-label="Quitar campaña"
              className="col-span-1 flex justify-center text-ink-muted hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={guardar}
        className="press rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        {saved ? "Guardado" : "Guardar parámetros"}
      </button>
    </div>
  );
}

function Facturacion() {
  const lista = productores.list();
  const [id, setId] = useState(lista[0]?.id ?? "");
  const [meses, setMeses] = useState<FacturacionMes[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = productores.get(id);
    setMeses(p?.facturacionMensual ? p.facturacionMensual.map((m) => ({ ...m })) : []);
  }, [id]);

  const maxVol = Math.max(1, ...lista.map((p) => facturacionTotal(p)));
  const prod = productores.get(id);
  const score = prod ? scoringCliente({ ...prod, facturacionMensual: meses }, maxVol) : null;
  const total = meses.reduce((a, m) => a + (m.monto || 0), 0);

  const patch = (i: number, p: Partial<FacturacionMes>) =>
    setMeses((ms) => ms.map((m, n) => (n === i ? { ...m, ...p } : m)));

  const guardar = async () => {
    const productor = productores.get(id);
    if (!productor) return;
    setSaving(true);
    await productores.save({
      ...productor,
      facturacionMensual: meses.filter((m) => m.periodo),
      updatedAt: Date.now(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        Cargá la facturación mes a mes de cada cliente. Con eso y el valor potencial se calcula el
        scoring del cliente.
      </p>
      <div className="max-w-xs">
        <Dropdown
          value={id}
          options={lista.map((p) => ({ value: p.id, label: p.razonSocial }))}
          onChange={setId}
        />
      </div>

      {score && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-ink-muted">Scoring del cliente</p>
              <p className="font-display text-[28px] font-bold leading-none text-ink">
                {score.score}
                <span className="text-[14px] font-medium text-ink-muted">/100</span>
              </p>
            </div>
            <span
              className={`rounded-pill px-3 py-1 text-[13px] font-semibold ${
                score.categoria === "Alto"
                  ? "bg-accent/10 text-accent-dark"
                  : score.categoria === "Medio"
                    ? "bg-amber/15 text-amber"
                    : "bg-danger/10 text-danger"
              }`}
            >
              {score.categoria}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[12px]">
            <div>
              <div className="flex justify-between text-ink-muted">
                <span>Captura (facturado / potencial)</span>
                <span>{Math.round(score.captura * 100)}%</span>
              </div>
              <Bar pct={score.captura * 100} tone="accent" />
            </div>
            <div>
              <div className="flex justify-between text-ink-muted">
                <span>Constancia (meses facturados)</span>
                <span>{Math.round(score.constancia * 100)}%</span>
              </div>
              <Bar pct={score.constancia * 100} />
            </div>
            <div>
              <div className="flex justify-between text-ink-muted">
                <span>Volumen facturado</span>
                <span>{formatUsd(score.volumen)}</span>
              </div>
              <Bar pct={maxVol > 0 ? (score.volumen / maxVol) * 100 : 0} tone="amber" />
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-[14px] font-semibold text-ink">Facturación mensual</p>
          <button
            onClick={() => setMeses((ms) => [...ms, { periodo: "", monto: 0 }])}
            className="flex items-center gap-1 text-[13px] font-semibold text-primary"
          >
            <Plus size={15} /> Agregar mes
          </button>
        </div>
        {meses.length === 0 && (
          <p className="text-[12px] text-ink-muted">Sin facturación cargada. Agregá un mes.</p>
        )}
        {meses.map((m, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <input
              type="month"
              value={m.periodo}
              onChange={(e) => patch(i, { periodo: e.target.value })}
              className="col-span-6 rounded-lg border border-line bg-white px-2 py-2 text-[13px] outline-none"
            />
            <input
              type="number"
              value={m.monto || 0}
              onChange={(e) => patch(i, { monto: Number(e.target.value) })}
              placeholder="U$S"
              className="col-span-5 rounded-lg border border-line bg-white px-2 py-2 text-right text-[13px] outline-none"
            />
            <button
              onClick={() => setMeses((ms) => ms.filter((_, n) => n !== i))}
              aria-label="Quitar mes"
              className="col-span-1 flex justify-center text-ink-muted hover:text-danger"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2 text-[13px]">
          <span className="text-ink-muted">Total facturado</span>
          <span className="font-semibold text-ink">{formatUsd(total)}</span>
        </div>
      </div>

      <button
        onClick={guardar}
        disabled={saving || !id}
        className="press rounded-2xl bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-disabled"
      >
        {saving ? "Guardando…" : saved ? "Guardado" : "Guardar facturación"}
      </button>
    </div>
  );
}

function ValorClienteScreen() {
  const lista = productores.list();
  const [id, setId] = useState(lista[0]?.id ?? "");
  const [rows, setRows] = useState<Cultivo[]>([]);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = productores.get(id);
    setRows(
      p
        ? p.unidades
            .flatMap((u) => u.cultivos)
            .map((c) => ({ ...c, insumos: (c.insumos ?? []).map((x) => ({ ...x })) }))
        : [],
    );
  }, [id]);

  const potencial = rows.reduce((a, c) => a + valorCultivo(c), 0);
  const facturado = rows.reduce((a, c) => a + facturadoCultivo(c), 0);
  const oportunidad = potencial - facturado;
  const captura = potencial > 0 ? facturado / potencial : 0;

  const patchCultivo = (i: number, p: Partial<Cultivo>) =>
    setRows((rs) => rs.map((c, n) => (n === i ? { ...c, ...p } : c)));
  const patchInsumo = (ci: number, ii: number, p: Partial<InsumoLinea>) =>
    setRows((rs) =>
      rs.map((c, n) =>
        n === ci
          ? { ...c, insumos: (c.insumos ?? []).map((x, m) => (m === ii ? { ...x, ...p } : x)) }
          : c,
      ),
    );
  const addInsumo = (ci: number) =>
    setRows((rs) =>
      rs.map((c, n) =>
        n === ci
          ? {
              ...c,
              insumos: [
                ...(c.insumos ?? []),
                { producto: "", unidad: "u", unidadXHa: 0, usdXUnidad: 0, facturacionAnterior: 0 },
              ],
            }
          : c,
      ),
    );
  const removeInsumo = (ci: number, ii: number) =>
    setRows((rs) =>
      rs.map((c, n) => (n === ci ? { ...c, insumos: (c.insumos ?? []).filter((_, m) => m !== ii) } : c)),
    );

  const guardar = async () => {
    const productor = productores.get(id);
    if (!productor) return;
    const antes = valorClienteTotal(productor);
    setSaving(true);
    await productores.save({
      ...productor,
      unidades: [{ id: productor.unidades[0]?.id ?? newId(), cultivos: rows }],
      updatedAt: Date.now(),
    });
    if (Math.round(antes) !== Math.round(potencial)) {
      void registrarAuditoria({
        cliente: productor.razonSocial,
        campo: "Valor Cliente",
        valorAnterior: formatUsd(antes),
        valorNuevo: formatUsd(potencial),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const numField =
    "w-full rounded-lg border border-line bg-white px-2 py-1.5 text-right text-[13px] outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10";
  const txtField =
    "w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[13px] outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10";

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        Armá la canasta de insumos por cultivo (dosis/ha, precio y lo facturado el ciclo anterior).
        El valor potencial y la oportunidad se calculan solos.
      </p>
      <div className="max-w-xs">
        <Dropdown
          value={id}
          options={lista.map((p) => ({ value: p.id, label: p.razonSocial }))}
          onChange={setId}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Target} label="Valor potencial" value={formatUsd(potencial)} tone="accent" />
        <Kpi icon={DollarSign} label="Facturado" value={formatUsd(facturado)} />
        <Kpi icon={TrendingUp} label="Oportunidad" value={formatUsd(oportunidad)} tone="amber" />
        <Kpi icon={Gauge} label="Capturado" value={formatPct(captura)} />
      </div>

      {rows.map((c, ci) => {
        const potC = valorCultivo(c);
        const factC = facturadoCultivo(c);
        return (
          <div key={c.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sprout size={16} className="text-accent" />
                <select
                  value={c.cultivo}
                  onChange={(e) => patchCultivo(ci, { cultivo: e.target.value })}
                  className="rounded-lg border border-line bg-white px-2 py-1.5 text-[14px] font-semibold outline-none"
                >
                  {CULTIVOS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={c.superficieHa || 0}
                  onChange={(e) => patchCultivo(ci, { superficieHa: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-line bg-white px-2 py-1.5 text-right text-[13px] outline-none"
                />
                <span className="text-[12px] text-ink-muted">ha</span>
              </div>
              <button
                onClick={() => setRows((rs) => rs.filter((_, n) => n !== ci))}
                className="text-[12px] text-ink-muted hover:text-danger"
              >
                Quitar cultivo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-[13px]">
                <thead className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-2 py-1 font-medium">Producto</th>
                    <th className="px-2 py-1 font-medium">Unidad</th>
                    <th className="px-2 py-1 text-right font-medium">Dosis/ha</th>
                    <th className="px-2 py-1 text-right font-medium">Precio U$S</th>
                    <th className="px-2 py-1 text-right font-medium">Fact. ant.</th>
                    <th className="px-2 py-1 text-right font-medium">Inv. pot.</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {(c.insumos ?? []).map((ins, ii) => (
                    <tr key={ii} className="border-t border-line">
                      <td className="min-w-[140px] px-2 py-1.5">
                        <input
                          value={ins.producto}
                          onChange={(e) => patchInsumo(ci, ii, { producto: e.target.value })}
                          className={txtField}
                          placeholder="Producto"
                        />
                      </td>
                      <td className="w-20 px-2 py-1.5">
                        <input
                          value={ins.unidad ?? ""}
                          onChange={(e) => patchInsumo(ci, ii, { unidad: e.target.value })}
                          className={txtField}
                          placeholder="u"
                        />
                      </td>
                      <td className="w-24 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.unidadXHa || 0}
                          onChange={(e) => patchInsumo(ci, ii, { unidadXHa: Number(e.target.value) })}
                          className={numField}
                        />
                      </td>
                      <td className="w-24 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.usdXUnidad || 0}
                          onChange={(e) => patchInsumo(ci, ii, { usdXUnidad: Number(e.target.value) })}
                          className={numField}
                        />
                      </td>
                      <td className="w-28 px-2 py-1.5">
                        <input
                          type="number"
                          value={ins.facturacionAnterior || 0}
                          onChange={(e) =>
                            patchInsumo(ci, ii, { facturacionAnterior: Number(e.target.value) })
                          }
                          className={numField}
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right font-semibold text-accent">
                        {formatUsd(inversionInsumo(ins, c.superficieHa))}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          onClick={() => removeInsumo(ci, ii)}
                          aria-label="Quitar insumo"
                          className="text-ink-muted hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => addInsumo(ci)}
                className="flex items-center gap-1 text-[13px] font-semibold text-primary"
              >
                <Plus size={15} /> Agregar insumo
              </button>
              <span className="text-[13px] text-ink-soft">
                Potencial <span className="font-semibold text-accent">{formatUsd(potC)}</span> · Fact.{" "}
                <span className="font-semibold text-ink">{formatUsd(factC)}</span> · Oport.{" "}
                <span className="font-semibold text-amber">{formatUsd(potC - factC)}</span>
              </span>
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setRows((rs) => [
              ...rs,
              { id: newId(), cultivo: "Maíz", superficieHa: 0, facturado: 0, insumos: [] },
            ])
          }
          className="flex items-center gap-1 rounded-2xl border border-line bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Plus size={15} /> Agregar cultivo
        </button>
        <button
          onClick={guardar}
          disabled={saving || !id}
          className="press rounded-2xl bg-primary px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-disabled"
        >
          {saving ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function Auditoria() {
  const [rows, setRows] = useState<AuditoriaEvento[]>([]);
  useEffect(() => {
    void listarAuditoria().then(setRows);
  }, []);
  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-ink-muted">
        Sin cambios registrados todavía. Cada modificación del Valor Cliente queda asentada acá con
        quién la hizo, cuándo, y el valor anterior y nuevo.
      </p>
    );
  }
  return (
    <TableShell head={["Fecha", "Usuario", "Rol", "Cliente", "Cambio"]}>
      {rows.map((e, i) => (
        <tr key={e.id ?? i} className="border-t border-line">
          <td className="px-4 py-3 text-ink-soft">
            {e.fecha ? new Date(e.fecha).toLocaleString("es-AR") : "—"}
          </td>
          <td className="px-4 py-3 text-right font-medium text-ink">{e.usuario ?? "—"}</td>
          <td className="px-4 py-3 text-right text-ink-soft">{e.rol ? rolLabel(e.rol) : "—"}</td>
          <td className="px-4 py-3 text-right text-ink-soft">{e.cliente ?? "—"}</td>
          <td className="px-4 py-3 text-right">
            <span className="inline-flex items-center gap-1.5 text-[12px]">
              <span className="text-ink-muted">{e.valorAnterior}</span>
              <ArrowRight size={13} className="text-ink-muted" />
              <span className="font-semibold text-accent">{e.valorNuevo}</span>
            </span>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

const SEM_STYLE: Record<string, { dot: string; chip: string }> = {
  verde: { dot: "bg-accent", chip: "bg-accent/10 text-accent-dark" },
  amarillo: { dot: "bg-amber", chip: "bg-amber/15 text-amber" },
  rojo: { dot: "bg-danger", chip: "bg-danger/10 text-danger" },
  gris: { dot: "bg-ink-muted", chip: "bg-surface text-ink-muted" },
};

function PanelSupervisor({ onParametros }: { onParametros: () => void }) {
  const camps = getCampanias();
  const stats = supervisorStats();
  const vend = supervisorVendedores();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-ink-muted">
          Cronograma de campañas y seguimiento de los vendedores según el paso del tiempo.
        </p>
        <button
          onClick={onParametros}
          className="flex items-center gap-1.5 rounded-2xl border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          <Sliders size={16} /> Parámetros
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Calendar} label="Campañas" value={String(stats.campanias)} />
        <Kpi icon={Activity} label="En curso" value={String(stats.enCurso)} tone="accent" />
        <Kpi icon={UserCheck} label="Vendedores al día" value={String(stats.aldia)} tone="accent" />
        <Kpi icon={AlertTriangle} label="En alerta" value={String(stats.alerta)} tone="amber" />
      </div>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Cronograma de campañas</h2>
        <div className="mt-3 space-y-4">
          {camps.map((c) => {
            const e = campEstado(c);
            const bar =
              e.kind === "verde"
                ? "bg-accent"
                : e.kind === "amarillo"
                  ? "bg-amber"
                  : e.kind === "rojo"
                    ? "bg-danger"
                    : "bg-ink-muted";
            return (
              <div key={c.nombre}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{c.nombre}</span>
                  <span className="text-[12px] text-ink-muted">
                    {formatFecha(c.inicio)} — {formatFecha(c.cierre)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-surface">
                  <div className={`h-2 rounded-pill ${bar}`} style={{ width: `${e.pct}%` }} />
                </div>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium ${SEM_STYLE[e.kind].chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${SEM_STYLE[e.kind].dot}`} /> {e.label} ·{" "}
                    {e.pct}% del tiempo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div>
        <p className="mb-2 text-[13px] font-medium text-ink-muted">
          Actividad de vendedores — semáforo
        </p>
        <TableShell head={["Vendedor", "Campaña", "Tiempo", "Avance", "Estado"]}>
          {vend.map((v) => (
            <tr key={v.vendedor} className="border-t border-line">
              <td className="px-4 py-3 font-medium text-ink">{v.vendedor}</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.campania}</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.tiempo}%</td>
              <td className="px-4 py-3 text-right text-ink-soft">{v.avance}%</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[12px] font-medium ${SEM_STYLE[v.kind].chip}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${SEM_STYLE[v.kind].dot}`} /> {v.label}
                </span>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </div>
  );
}

// El líder de equipo elige a quién mirar: todas las pantallas pasan a mostrar el
// trabajo de esa persona, y puede corregir lo que esté mal cargado.
function SelectorSombra() {
  const user = useApp((s) => s.user);
  const sombra = useApp((s) => s.sombra);
  const setSombraStore = useApp((s) => s.setSombra);
  const [equipo, setEquipo] = useState<CuentaUsuario[]>([]);

  useEffect(() => {
    void listarUsuarios().then((us) => setEquipo(us.filter((u) => u.id !== user?.id)));
  }, [user?.id]);

  if (!equipo.length) return null;
  const actual = equipo.find((u) => u.id === sombra);

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Eye size={15} className={sombra ? "text-primary" : "text-ink-muted"} />
      <select
        value={sombra ?? ""}
        onChange={(e) => setSombraStore(e.target.value || null)}
        aria-label="Ver el trabajo de"
        className={`max-w-[190px] rounded-xl border bg-white px-2.5 py-1.5 text-[13px] outline-none ${
          sombra ? "border-primary/40 font-semibold text-primary-dark" : "border-line text-ink-soft"
        }`}
      >
        <option value="">Todo el equipo</option>
        {equipo.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nombre}
          </option>
        ))}
      </select>
      {actual && (
        <span className="rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary-dark">
          Viendo como sombra
        </span>
      )}
    </div>
  );
}

const ROL_PLATAFORMA: { rol: string; label: string; icon: typeof Users }[] = [
  { rol: "vendedor", label: "Vendedores", icon: Users },
  { rol: "supervisor", label: "Supervisores", icon: Activity },
  { rol: "gerente", label: "Líderes de equipo", icon: UserCheck },
  { rol: "superadmin", label: "Super admins", icon: Shield },
];

function PanelPlataforma({ onIr }: { onIr: (s: Section) => void }) {
  const [usuarios, setUsuarios] = useState<CuentaUsuario[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  useEffect(() => {
    void listarUsuarios().then(setUsuarios);
    void listarAnuncios().then(setAnuncios);
  }, []);
  const activas = anuncios.filter((a) => a.activo).length;
  const usoClientes = productores.list().length;
  const usoActividades = notasCampo.list().length;
  const porRol = (r: string) => usuarios.filter((u) => u.rol === r).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Users} label="Cuentas totales" value={String(usuarios.length)} onClick={() => onIr("usuarios")} />
        <Kpi
          icon={Megaphone}
          label="Campañas activas"
          value={`${activas} / ${anuncios.length}`}
          tone="accent"
          onClick={() => onIr("campanias")}
        />
        <Kpi icon={Boxes} label="Clientes en el sistema" value={String(usoClientes)} />
        <Kpi icon={ClipboardCheck} label="Actividades registradas" value={String(usoActividades)} />
      </div>

      <section className="card">
        <h2 className="font-display text-[15px] font-semibold text-ink">Cuentas por tipo</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROL_PLATAFORMA.map((r) => (
            <div key={r.rol} className="flex items-center gap-3 rounded-2xl border border-line p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <r.icon size={19} />
              </div>
              <div>
                <p className="font-display text-[20px] font-bold leading-tight text-ink">{porRol(r.rol)}</p>
                <p className="text-[12px] text-ink-muted">{r.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onIr("usuarios")}
          className="card card-hover flex items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-semibold text-ink">Gestionar cuentas</p>
            <p className="text-[12px] text-ink-soft">Alta, baja y roles de los usuarios del sistema.</p>
          </div>
          <ArrowRight size={18} className="ml-auto shrink-0 text-ink-muted" />
        </button>
        <button
          onClick={() => onIr("campanias")}
          className="card card-hover flex items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent-dark">
            <Megaphone size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-semibold text-ink">Publicar campaña</p>
            <p className="text-[12px] text-ink-soft">Banners y comunicados para los usuarios.</p>
          </div>
          <ArrowRight size={18} className="ml-auto shrink-0 text-ink-muted" />
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const user = useApp((s) => s.user)!;
  const logout = useApp((s) => s.logout);
  const [section, setSection] = useState<Section>(
    user.rol === "supervisor" ? "supervisor" : user.rol === "superadmin" ? "plataforma" : "inicio",
  );
  const allowed: Section[] =
    user.rol === "vendedor"
      ? RAIL_VEND
      : user.rol === "supervisor"
        ? RAIL_SUP
        : user.rol === "superadmin"
          ? RAIL_ADMIN
          : NAV.filter(
              (n) => !["usuarios", "campanias", "plataforma"].includes(n.key),
            ).map((n) => n.key);
  const visibleNav = allowed
    .map((k) => NAV.find((n) => n.key === k))
    .filter(Boolean) as { key: Section; label: string; icon: typeof Users }[];
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("chaja.sidebar_collapsed") === "1",
  );
  const toggleSidebar = () =>
    setCollapsed((v) => {
      localStorage.setItem("chaja.sidebar_collapsed", v ? "0" : "1");
      return !v;
    });
  const dataVersion = useApp((s) => s.dataVersion);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [paramBack, setParamBack] = useState(false);
  const pend = pendingTotal();

  return (
    <div className="flex h-full bg-surface">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        className={`fixed inset-y-0 left-0 z-40 flex w-60 transform flex-col bg-panel text-white transition-transform md:relative md:z-auto md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-60"}`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1">
            <img src="/chaja-mark.png" alt="" className="h-full w-full object-contain" />
          </div>
          <span
            className={`font-display text-[18px] font-bold tracking-wide ${
              collapsed ? "inline md:hidden" : "inline"
            }`}
          >
            CHAJÁ
          </span>
          <button
            onClick={toggleSidebar}
            aria-label="Colapsar menú"
            className={`ml-auto items-center justify-center rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? "hidden" : "hidden md:flex"
            }`}
          >
            <PanelLeftClose size={18} />
          </button>
        </div>

        {collapsed && (
          <button
            onClick={toggleSidebar}
            aria-label="Expandir menú"
            className="mx-2 mb-1 hidden items-center justify-center rounded-xl py-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white md:flex"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        <nav className="mt-1 flex-1 space-y-1 overflow-y-auto px-2">
          {visibleNav.map((n) => {
            const active = n.key === section;
            return (
              <button
                key={n.key}
                onClick={() => {
                  setSection(n.key);
                  setParamBack(false);
                  setMobileOpen(false);
                }}
                title={n.label}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                  collapsed ? "md:justify-center md:gap-0" : ""
                } ${
                  active ? "bg-white/15 font-semibold text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <n.icon size={19} className="shrink-0" />
                <span className={collapsed ? "inline md:hidden" : "inline"}>{n.label}</span>
              </button>
            );
          })}
        </nav>

        <div
          className="border-t border-white/10 p-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <button
            onClick={() => setCuentaOpen(true)}
            title="Mi cuenta"
            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/65 transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? "md:justify-center md:gap-0 md:px-0" : ""
            }`}
          >
            <KeyRound size={19} className="shrink-0" />
            <span className={collapsed ? "inline md:hidden" : "inline"}>Mi cuenta</span>
          </button>
          {/* Dentro del APK no tiene sentido ofrecer la descarga del APK. */}
          {!Capacitor.isNativePlatform() && (
            <a
              href="/chaja.apk"
              download="Chaja.apk"
              title="Bajar app móvil"
              className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] text-white/65 transition-colors hover:bg-white/10 hover:text-white ${
                collapsed ? "md:justify-center md:gap-0 md:px-0" : ""
              }`}
            >
              <Download size={19} className="shrink-0" />
              <span className={collapsed ? "inline md:hidden" : "inline"}>Bajar app móvil</span>
            </a>
          )}
          <div className={`flex items-center gap-2 ${collapsed ? "md:justify-center" : ""}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[13px] font-semibold">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className={collapsed ? "min-w-0 flex-1 md:hidden" : "min-w-0 flex-1"}>
              <p className="truncate text-[13px] font-medium">{user.nombre}</p>
              <p className="text-[11px] text-white/55">{rolLabel(user.rol)}</p>
            </div>
            <button
              onClick={logout}
              aria-label="Salir"
              className={`text-white/65 hover:text-white ${collapsed ? "inline-flex md:hidden" : "inline-flex"}`}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.875rem)" }}
          className="flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-3.5 md:px-6 md:py-4"
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="-ml-1 rounded-lg p-1.5 text-ink transition-colors hover:bg-surface md:hidden"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0 leading-tight">
              <h1 className="truncate font-display text-[18px] font-semibold text-ink md:text-[20px]">
                {SECTION_TITLE[section]}
              </h1>
              <p className="truncate text-[13px] font-normal text-ink-soft">
                {SECTION_DESC[section]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {user.rol === "gerente" && <SelectorSombra />}
            {pend > 0 && (
              <span className="hidden rounded-pill bg-primary-tint px-3 py-1 text-[12px] font-medium text-primary-dark sm:inline">
                {pend} sin sincronizar
              </span>
            )}
            <div className="flex items-center gap-2.5">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-[13px] font-semibold text-ink">{user.nombre}</p>
                <p className="text-[11px] text-ink-muted">{rolLabel(user.rol)}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
                {user.nombre
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <main
          key={`${section}-${dataVersion}`}
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
          className="fade-in flex-1 overflow-y-auto"
        >
          {/* Contenido centrado con ancho máximo: dashboard con aire a los lados,
              no pegado a los bordes ni estirado de punta a punta. */}
          <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-6 lg:px-10">
          <AnunciosBanner />
          <SectionBanner section={section} />
          {section === "inicio" && <Inicio />}
          {section === "clientes" && <Clientes />}
          {section === "seguimiento" && <Seguimiento />}
          {section === "operaciones" && <Operaciones />}
          {section === "referidos" && <Referidos />}
          {section === "actividad" && (
            <CargarActividad onIrValorCliente={() => setSection("valorcliente")} />
          )}
          {section === "equipo" && <Equipo />}
          {section === "productos" && <Productos />}
          {section === "valorcliente" && <ValorClienteScreen />}
          {section === "parametros" && (
            <Parametros onVolver={paramBack ? () => setSection("supervisor") : undefined} />
          )}
          {section === "reportes" && <Reportes />}
          {section === "supervisor" && (
            <PanelSupervisor
              onParametros={() => {
                setParamBack(true);
                setSection("parametros");
              }}
            />
          )}
          {section === "auditoria" && <Auditoria />}
          {section === "facturacion" && <Facturacion />}
          {section === "usuarios" && <GestionUsuarios />}
          {section === "campanias" && <GestionCampanias />}
          {section === "plataforma" && <PanelPlataforma onIr={setSection} />}
          </div>
        </main>
        <Drawer open={cuentaOpen} onClose={() => setCuentaOpen(false)} title="Mi cuenta">
          <CambiarPassword onListo={() => setCuentaOpen(false)} />
        </Drawer>
      </div>
    </div>
  );
}
