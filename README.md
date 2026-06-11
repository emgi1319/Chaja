# FOROAGROHUB

Plataforma de Agroventas de Precisión: un sistema de gestión comercial para empresas
proveedoras del agro (agroinsumos, semillas, fitosanitarios, fertilizantes). Permite al
equipo de ventas trabajar en el campo —con o sin conexión— sobre la cartera de productores,
medir el potencial de cada cliente, seguir el proceso comercial y analizar resultados.

## Para qué sirve

El vendedor recorre productores en zonas con conectividad intermitente. La aplicación es su
libreta de trabajo: carga clientes, unidades productivas y cultivos, registra notas de campo
y formularios, y calcula el potencial de compra de cada productor. Todo queda guardado en el
dispositivo y se sincroniza con el servidor central en cuanto hay señal, sin interrumpir el
trabajo. La gerencia obtiene tableros de cumplimiento, embudo comercial y comparativos por
vendedor.

## Concepto comercial

El método se apoya en el **Valor Cliente**: cuánto invierte un productor en insumos a lo largo
de su campaña (su potencial total de compra) frente a cuánto nos compra efectivamente. La
diferencia entre ambos es la oportunidad de venta concreta sobre la que trabaja el equipo.

## Módulos

- **Productos y servicios**: catálogo con principio activo, presentación, precios y stock.
- **Productores**: ficha de cliente con contactos múltiples, datos productivos, unidades y
  cultivos georreferenciados, facturación histórica y clasificación.
- **Valor Cliente**: calculador de potencial por cultivo e insumo, con comparación contra la
  facturación del ciclo anterior.
- **Proceso comercial**: embudo de estados (desde el primer contacto hasta la cobranza),
  agenda con semáforo de vencimientos y notas de campo.
- **Referidos**: captación y seguimiento de nuevos prospectos.
- **Objetivos y campañas**: metas en U$S por campaña de cultivo y por producto, con ventanas
  de campaña y precampaña.
- **Análisis de resultados**: tableros en dos niveles (vendedor y gerencia) con cumplimiento,
  comparativos, semáforo de tiempos y análisis asistido.
- **Formularios**: visita a campo, presupuesto, nota de pedido y referidos, con envío por
  WhatsApp.

## Stack

- **App**: Vite + React 19 + TypeScript + Tailwind CSS + Zustand.
- **Móvil**: Capacitor 7 (Android primero, base preparada para iOS).
- **Persistencia local**: almacenamiento en el dispositivo con sincronización diferida
  (offline-first).
- **Backend**: PHP + MySQL sobre hosting, expone una API REST con clave de acceso.
- **Mapas**: georreferenciación de unidades productivas.

## Estructura

```
.
├── app/        Aplicación cliente (Vite + React + Capacitor)
├── server/     API REST en PHP + esquema MySQL
└── docs/       Documentación técnica y de dominio
```

## Documentación

- [docs/arquitectura.md](docs/arquitectura.md) — stack, sincronización offline-first, roles.
- [docs/dominio.md](docs/dominio.md) — modelo de datos completo del negocio.
- [docs/valor-cliente.md](docs/valor-cliente.md) — fórmula y calculador de potencial.
- [docs/proceso-comercial.md](docs/proceso-comercial.md) — embudo, agenda y notas de campo.
- [docs/benchmark.md](docs/benchmark.md) — referencias del sector.

## Desarrollo

```bash
cd app
npm install
npm run dev                 # navegador
npm run build               # genera dist/
npx cap sync android        # sincroniza al proyecto Android
```

## Entrega

El desarrollo se organiza en dos hitos funcionales:

- **Hito 1**: base operativa de campo — acceso por usuario, productores, catálogo offline,
  notas de campo y sincronización con el servidor.
- **Hito 2**: sistema completo — Valor Cliente, objetivos y campañas, formularios, roles,
  tableros de análisis y entrega de la aplicación.
